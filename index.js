'use strict';

const VM = require('./lib/vm');

const vm = new VM();

vm.loadProgram([
    1,
    2,
    0x40000001,
    3,
    0x40000001,
    0x40000000
]);

vm.run();
