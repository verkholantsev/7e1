'use strict';

const VM = require('./lib/vm');

const vm = new VM();

// const helloWordProgram = [
//     72,
//     0x40000009,
//     101,
//     0x40000009,
//     108,
//     0x40000009,
//     108,
//     0x40000009,
//     111,
//     0x40000009,
//     32,
//     0x40000009,
//     119,
//     0x40000009,
//     111,
//     0x40000009,
//     114,
//     0x40000009,
//     108,
//     0x40000009,
//     100,
//     0x40000009,
//     0x40000000
// ];

const HALT = 0x40000000;
const SUB = 0x40000002;
const DUP = 0x40000005;
const JMP = 0x40000006;
const JZ = 0x40000007;
const PRN = 0x40000008;
const LOAD = 0x4000000A;
const STOR = 0x4000000B;

const INITIAL_COUNTER_VALUE = 10;
const COUNTER_ADDRESS = 0;

vm.loadProgram([
    INITIAL_COUNTER_VALUE, //               0
    COUNTER_ADDRESS, //                     1
    STOR, // label(2)                       2

    COUNTER_ADDRESS, //                     3
    LOAD, //                                4

    1, //                                   5
    SUB, //                                 6

    DUP, //                                 7
    COUNTER_ADDRESS, //                     8
    STOR, //                                9

    DUP, //                                 10
    PRN, //                                 11

    15, // jump to label(15)                12
    JZ, //                                  13

    2, // jump to label(2)                  14
    JMP, // label(15)                       15

    HALT, //                                16
]);

vm.run();
