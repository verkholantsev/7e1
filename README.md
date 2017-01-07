# 7e1 - Stack VM written in JavaScript

## Files structure

```
lib/vm.js - source code of vm
index.js  - vm usage
```

## How to run

To run vm

```sh
node index.js
```

To run vm in debug mode

```sh
DEBUG=1 node index.js
```

## Instruction structure

Each instruction is an unsigned 32 bit integer. Two bits reserved for instruction type.

```
00 - positive integer
01 - primitive instruction
10 - negative integer
11 - not in use
```

30 bits are reserved for instruction data.
