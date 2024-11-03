export default [
	{
		code: `
            module abs
        
            ; memory
            int DEFAULT_VALUE 0
            int* in &DEFAULT_VALUE
            int out 0
            int test 1
        
            ; locals
            local int input
        
            ; code
            push &out
            push in
            localSet input
            push input
            push 0
            lessThan
            if 
                push 0
                push input
                sub
            else
                push input
                ifEnd
            store
            moduleEnd
        `.split('\n'),
	},
];
