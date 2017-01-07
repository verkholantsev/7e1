'use strict';

const VM_MEMORY_SIZE = 20;
const PROGRAM_COUNTER_OFFSET = 10;

/*
 * Defines types of instruction
 * @enum
 */
const INSTRUCTION_TYPES = {
    POSITIVE_INTEGER: 0,
    PRIMITIVE_INTRUCTION: 1,
    NEGATIVE_INTEGER: 2,
    UNDEFINED: 3
};

/*
 * 0xC0000000 = 1100 0000 0000 0000 0000 0000 0000 0000
 *              ^                   ^                 ^
 *              31                  15                0
 */
const TYPE_MASK = 0xC0000000;

/*
 * 0x3FFFFFFF = 0011 1111 1111 1111 1111 1111 1111 1111
 *              ^                   ^                 ^
 *              31                  15                0
 */
const DATA_MASK = 0x3FFFFFFF;

/**
 * Defines types of primitive instruction
 * @enum
 */
const PRIMITIVE_INTRUCTION_TYPES = {
    HALT: 0,
    ADD: 1
};

class VM {
    constructor() {
        /*
         * Memory of virtual machine is a vector of unsigned 32 bit integers
         */
        this._memory = new Uint32Array(VM_MEMORY_SIZE);

        /*
         * Stack pointer
         */
        this._stackPointer = 0;

        /*
         * Program counter
         */
        this._programCounter = PROGRAM_COUNTER_OFFSET;

        /*
         * Type register
         */
        this._typeRegister = 0;

        /*
         * Data register
         */
        this._dataRegister = 0;

        /*
         * Machine is running flag
         */
        this._isRunning = false;
    }

    /*
     * @param {number} instruction
     * @return {number}
     */
    _getType(instruction) {
        const type = (instruction & TYPE_MASK) >> 30;
        this._typeRegister = type;
        return type;
    }

    /*
     * @param {number} instruction
     * @return {number}
     */
    _getData(instruction) {
        const data = (instruction & DATA_MASK);
        this._dataRegister = data;
        return data;
    }

    /**
     * Increments program counter to next instruction
     */
    _fetch() {
        if (this._programCounter + 1 > this._memory.length - 1) {
            throw new Error('Program counter is out of memory');
        }

        this._programCounter++;
    }

    /**
     * Puts type and data of current instruction
     * to corresponding registers
     */
    _decode() {
        const instruction = this._memory[this._programCounter];

        this._getType(instruction);
        this._getData(instruction);
    }

    /**
     * Executes current instruction
     */
    _execute() {
        if (this._typeRegister === INSTRUCTION_TYPES.POSITIVE_INTEGER
            || this._typeRegister === INSTRUCTION_TYPES.NEGATIVE_INTEGER) {
            this._stackPointer++;
            this._memory[this._stackPointer] = this._dataRegister;
        } else {
            this._doPrimitive();
        }
    }

    _doPrimitive() {
        switch (this._dataRegister) {
            case PRIMITIVE_INTRUCTION_TYPES.HALT: {
                _log('HALT');
                this._isRunning = false;
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.ADD: {
                _log(`ADD ${this._memory[this._stackPointer - 1]} ${this._memory[this._stackPointer]}`);
                const sp = this._stackPointer;
                this._memory[sp - 1] = this._memory[sp - 1] + this._memory[sp];
                this._stackPointer--;
                break;
            }

            default: {
                throw new Error(`Unknown primitive type ${this._dataRegister}`);
            }
        }
    }

    /**
     * Runs machine until it stops
     */
    run() {
        this._isRunning = true;
        this._programCounter -= 1;

        while (this._isRunning === true) {
            this._fetch();
            this._decode();
            this._execute();
        }

        _log(`Top of stack: ${this._memory[this._stackPointer]}`);
    }

    /**
     * Loads program (as an Uint32Array) to machine's memory
     * starting from program counter
     */
    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this._memory[this._programCounter + i] = program[i];
        }
    }
}

/**
 * Logs debug data
 */
function _log(...args) {
    console.log.apply(console, args); // eslint-disable-line no-console
}

module.exports = VM;
