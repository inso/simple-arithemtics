(function () {
    var getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    function SubtractionOperation() {}
    SubtractionOperation.prototype.title = function () {
        return 'Subtraction';
    };
    SubtractionOperation.prototype.symbol = function () {
        return '-';
    };
    SubtractionOperation.prototype.numbers = function (min, max) {
        var number1 = getRandomInt(min + 1, max);
        var number2 = getRandomInt(min, number1 - 1);

        return [number1, number2];
    };
    SubtractionOperation.prototype.answer = function (number1, number2) {
        return number1 - number2;
    };

    function AdditionOperation() {}
    AdditionOperation.prototype.title = function () {
        return 'Addition';
    };
    AdditionOperation.prototype.symbol = function () {
        return '+';
    };
    AdditionOperation.prototype.numbers = function (min, max) {
        var number1 = getRandomInt(min, max);
        var number2 = getRandomInt(min, max);

        return [number1, number2];
    };
    AdditionOperation.prototype.answer = function (number1, number2) {
        return number1 + number2;
    };

    var buildIntModelTransformer = function (fieldName) {
        return {
            get: function () {
                if (this[fieldName] === null || isNaN(this[fieldName])) {
                    return '';
                }

                return '' + this[fieldName];
            },
            set: function (value) {
                this[fieldName] = parseInt(value);
            }
        }
    };

    new Vue({
        el: "#app",
        data: {
            operationName: 'sub',
            operations: {
                'sub': new SubtractionOperation(),
                'add': new AdditionOperation(),
            },
            min: 1,
            max: 20,
            maxPreviousCorrectAnswersCount: 10,
            previousResultsCount: 5,
            started: false,
            mode: 'stopped',
            number1: null,
            number2: null,
            answer: null,
            answersCount: 0,
            averageTime: null,
            iterationStartTime: null,
            previousResults: [],
            previousCorrectAnswers: [],
            wrongAnswersCount: 0,
            minTime: null,
            maxTime: null
        },
        computed: {
            correctAnswer: function () {
                if (this.number1 === null || this.number2 === null) {
                    return null;
                }

                return this.operation.answer(this.number1, this.number2);
            },
            rawAnswer: buildIntModelTransformer('answer'),
            rawMin: buildIntModelTransformer('min'),
            rawMax: buildIntModelTransformer('max'),
            operation: function () {
                return this.operations[this.operationName];
            },
            previousCorrectAnswersCount: function () {
                var minMaxBased = Math.floor((this.max - this.min) / 2);

                if (isNaN(minMaxBased) || minMaxBased < 0) {
                    return 0;
                }

                return Math.min(this.maxPreviousCorrectAnswersCount, minMaxBased);
            },
            wrongAnswersCountPercentage: function () {
                return this.wrongAnswersCount / this.answersCount * 100;
            },
            correctAnswersCount: function () {
                return this.answersCount - this.wrongAnswersCount;
            },
            correctAnswersCountPercentage: function () {
                return this.correctAnswersCount / this.answersCount * 100;
            },
            correctWrongAnswersRatio: function () {
                return this.correctAnswersCount / this.wrongAnswersCount;
            },
            score: function () {
                return (this.correctAnswersCountPercentage * (this.answersCount / 10)) / this.averageTime * 100;
            }
        },
        methods: {
            nextIteration: function () {
                this.iterationStartTime = Date.now();
                this.rawAnswer = '';

                var numbers, isBadNumbers, i = 0;

                do {
                    numbers = this.operation.numbers(this.min, this.max);
                    isBadNumbers =
                        this.number1 === numbers[0]
                            ||
                        this.number2 === numbers[1]
                            ||
                        this.hasPreviousSuccessAnswer(this.operation.answer(numbers[0], numbers[1]))
                    ;
                } while (isBadNumbers && ++i < 100);

                this.number1 = numbers[0];
                this.number2 = numbers[1];
            },
            answerSubmit: function (event) {
                if (event.which !== 13 || this.answer === null || isNaN(this.answer)) {
                    return;
                }

                this.answersCount += 1;
                var answer = this.answer;
                this.rawAnswer = '';
                var wasWrong = this.correctAnswer !== answer;

                this.previousResults = this.previousResults.slice(0, this.previousResultsCount - 1);
                this.previousResults.unshift({
                    wrong: wasWrong,
                    number1: this.number1,
                    number2: this.number2,
                    answer: answer
                });

                if (!wasWrong) {
                    var time = (Date.now() - this.iterationStartTime) / 1000;

                    if (this.averageTime === null) {
                        this.averageTime = time;
                    } else {
                        this.averageTime += ((time - this.averageTime) / this.answersCount);
                    }

                    if (this.minTime === null || this.minTime > time) {
                        this.minTime = time;
                    }

                    if (this.maxTime === null || this.maxTime < time) {
                        this.maxTime = time;
                    }

                    if (this.previousCorrectAnswersCount > 0) {
                        this.previousCorrectAnswers = this.previousCorrectAnswers.slice(0, this.previousCorrectAnswersCount - 1);
                        this.previousCorrectAnswers.unshift(answer);
                    } else {
                        this.previousCorrectAnswers = [];
                    }
                } else {
                    this.wrongAnswersCount += 1;
                }

                this.nextIteration();
            },
            hasPreviousSuccessAnswer: function (answer) {
                return this.previousCorrectAnswers.indexOf(answer) !== -1;
            }
        },
        watch: {
            mode: function (value) {
                if (value === 'started') {
                    this.answersCount = 0;
                    this.averageTime = null;
                    this.previousResults = [];
                    this.previousCorrectAnswers = [];
                    this.wrongAnswersCount = 0;
                    this.nextIteration();
                }
            },
            min: function (value) {
                if (value > this.max) {
                    this.min = this.max - 1;
                }
            }
        },
        directives: {
            focus: {
                componentUpdated: function (el) {
                    el.focus();
                }
            }
        },
        filters: {
            'float': function (value, fraction) {
                if (value !== null) {
                    if (typeof(fraction) === 'undefined') {
                        fraction = 2;
                    }

                    var result = parseFloat(value).toFixed(fraction);

                    if (!isNaN(result)) {
                        return result;
                    }
                }

                return '-';
            },
            'int': function (value) {
                if (value !== null && value >= 0) {
                    return parseInt(value);
                }

                return '-';
            }
        }
    });
})();
