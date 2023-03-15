export default [
	{
		state: {},
		code: `
            module abs
        
            # memory
            memory int DEFAULT_VALUE 0
            memory int* in &DEFAULT_VALUE
            memory int out 0
        
            # locals
            local input
        
            # code
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
            end
            store
        `.split('\n'),
	},
];
