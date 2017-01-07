'use strict';

const VM_MEMORY_SIZE = 150;
const INSTRUCTION_POINTER_OFFSET = 50;
const PROGRAM_MEMORY_OFFSET = 100;

const POINTER_TYPES = {
    STACK_POINTER: 'STACK_POINTER',
    INSTRUCTION_POINTER: 'INSTRUCTION_POINTER',
    PROGRAM_MEMORY_POINTER: 'PROGRAM_MEMORY_POINTER',
};

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
    HALT: 0, // Ends run of machine
    ADD: 1, // Adds two numbers on stack
    SUB: 2, // Subtracts number on top of stack from previous number
    MUL: 3, // Multiplies two numbers on stack
    DIV: 4, // Uses number on top of stack as divisor and divides previous number by it
    DUP: 5, // Duplicates number on top of stack
    JMP: 6, // Unconditional jump to instruction
    JZ: 7, // Jumps to instruction if zero is on the top of the stack
    PRN: 8, // Prints top of stack
    PRNCHAR: 9, // Prints top of stack as ASCII char
    LOAD: 10, // Loads value from memory to top of stack
    STOR: 11, // Stores value from top of stack in memory
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
         * Instruction pointer
         */
        this._instructionPointer = INSTRUCTION_POINTER_OFFSET;

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
     * Increments instruction pointer to next instruction
     */
    _fetch() {
        this._checkBounds(POINTER_TYPES.INSTRUCTION_POINTER, this._instructionPointer + 1);

        this._instructionPointer++;
    }

    /**
     * Puts type and data of current instruction
     * to corresponding registers
     */
    _decode() {
        const instruction = this._memory[this._instructionPointer];

        this._getType(instruction);
        this._getData(instruction);
    }

    /**
     * Executes current instruction
     */
    _execute() {
        if (this._typeRegister === INSTRUCTION_TYPES.POSITIVE_INTEGER
            || this._typeRegister === INSTRUCTION_TYPES.NEGATIVE_INTEGER) {

            _log(`PUSH ${this._dataRegister}`);
            this._push(this._dataRegister);
        } else {
            this._doPrimitive();
        }
    }

    /**
     * Does primitive instruction
     */
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

            case PRIMITIVE_INTRUCTION_TYPES.SUB: {
                _log(`SUB ${this._memory[this._stackPointer - 1]} ${this._memory[this._stackPointer]}`);
                const sp = this._stackPointer;
                this._memory[sp - 1] = this._memory[sp - 1] - this._memory[sp];
                this._stackPointer--;
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.MUL: {
                _log(`MUL ${this._memory[this._stackPointer - 1]} ${this._memory[this._stackPointer]}`);
                const sp = this._stackPointer;
                this._memory[sp - 1] = this._memory[sp - 1] * this._memory[sp];
                this._stackPointer--;
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.DIV: {
                _log(`DIV ${this._memory[this._stackPointer - 1]} ${this._memory[this._stackPointer]}`);
                const sp = this._stackPointer;

                if (this._memory[sp] === 0) {
                    throw new Error('Division by zero');
                }

                this._memory[sp - 1] = this._memory[sp - 1] / this._memory[sp];
                this._stackPointer--;
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.DUP: {
                _log(`DUP ${this._memory[this._stackPointer]}`);

                this._push(this._memory[this._stackPointer]);
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.JMP: {
                _log(`JMP ${this._memory[this._stackPointer]}`);

                const jumpTo = this._pop() + INSTRUCTION_POINTER_OFFSET;

                this._checkBounds(POINTER_TYPES.INSTRUCTION_POINTER, jumpTo);

                this._instructionPointer = jumpTo;
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.JZ: {
                const jumpTo = this._pop() + INSTRUCTION_POINTER_OFFSET;
                this._checkBounds(POINTER_TYPES.INSTRUCTION_POINTER, jumpTo);

                const topOfStack = this._pop();

                _log(`JZ ${jumpTo - INSTRUCTION_POINTER_OFFSET} (Top of stack ${topOfStack})`);

                if (topOfStack === 0) {
                    this._instructionPointer = jumpTo;
                }

                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.PRN: {
                _log(`PRN ${this._peek()}`);
                process.stdout.write(String(this._pop()));
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.PRNCHAR: {
                _log(`PRNCHAR ${this._peek()}`);
                process.stdout.write(String.fromCharCode(this._pop()));
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.LOAD: {
                const pointer = this._pop() + PROGRAM_MEMORY_OFFSET;
                this._checkBounds(POINTER_TYPES.PROGRAM_MEMORY_POINTER, pointer);
                _log(`LOAD ${pointer - PROGRAM_MEMORY_OFFSET}`);
                this._push(this._memory[pointer]);
                break;
            }

            case PRIMITIVE_INTRUCTION_TYPES.STOR: {
                const pointer = this._pop() + PROGRAM_MEMORY_OFFSET;
                const value = this._pop();
                this._checkBounds(POINTER_TYPES.PROGRAM_MEMORY_POINTER, pointer);
                _log(`STOR ${pointer - PROGRAM_MEMORY_OFFSET} (Top of stack ${value})`);
                this._memory[pointer] = value;
                break;
            }

            default: {
                throw new Error(`Unknown primitive type ${this._dataRegister}`);
            }
        }
    }

    /**
     * Checks if pointer is in bounds for its type
     * @param {type} string
     * @param {number} pointer
     */
    _checkBounds(type, pointer) {
        switch (type) {
            case POINTER_TYPES.STACK_POINTER: {
                if (pointer > 0 && pointer < INSTRUCTION_POINTER_OFFSET) {
                    return;
                }
                break;
            }

            case POINTER_TYPES.INSTRUCTION_POINTER: {
                if (pointer >= INSTRUCTION_POINTER_OFFSET && pointer < PROGRAM_MEMORY_OFFSET) {
                    return;
                }
                break;
            }

            case POINTER_TYPES.PROGRAM_MEMORY_POINTER: {
                if (pointer >= PROGRAM_MEMORY_OFFSET && pointer < VM_MEMORY_SIZE) {
                    return;
                }
                break;
            }
        }

        throw new Error(`Pointer ${pointer} is out of bounds for ${type}`);
    }

    /**
     * Checks if incrementation of stack pointer could be done
     * and pushs value to stack
     */
    _push(value) {
        this._checkBounds(POINTER_TYPES.STACK_POINTER, this._stackPointer + 1);
        this._stackPointer++;
        this._memory[this._stackPointer] = value;
    }

    /*
     * Return value on top of stack
     */
    _peek() {
        return this._memory[this._stackPointer];
    }

    /**
     * Pops value from stack
     * @return {number}
     */
    _pop() {
        return this._memory[this._stackPointer--];
    }

    /**
     * Runs machine until it stops
     */
    run() {
        this._isRunning = true;
        this._instructionPointer -= 1;

        while (this._isRunning === true) {
            this._fetch();
            this._decode();
            this._execute();
        }

        _log(`Top of stack: ${this._memory[this._stackPointer]}`);
        _log(this._memory.join(' '));
    }

    /**
     * Loads program (as an Uint32Array) to machine's memory
     * starting from instruction pointer
     */
    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this._checkBounds(POINTER_TYPES.INSTRUCTION_POINTER, this._instructionPointer + i);
            this._memory[this._instructionPointer + i] = program[i];
        }
    }
}

/**
 * Logs debug data
 */
function _log(...args) {
    if (Number(process.env.DEBUG) === 1) {
        console.log.apply(console, args); // eslint-disable-line no-console
    }
}

module.exports = VM;
