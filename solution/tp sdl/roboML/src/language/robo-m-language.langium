grammar RoboMLanguage

entry Program:
    (functions+=FunctionDeclaration)*
    entry=EntryFunction
    (functions+=FunctionDeclaration)*;

EntryFunction:
    'let' returnType=('void' | 'number' | 'boolean') 'entry' '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' 
    '{' 
        (body+=Statement)* 
    '}';

FunctionDeclaration:
    'let' returnType=('void' | 'number' | 'boolean') name=ID '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' 
    '{' 
        (body+=Statement)* 
    '}';

Parameter:
    type=('number' | 'boolean') name=ID;

// ============================================
// STATEMENTS
// ============================================

Statement:
    VariableDeclaration | Assignment | Loop | Condition | Command;

VariableDeclaration:
    'var' type=('number' | 'boolean') name=ID ('=' initialValue=Expression)?;

Assignment:
    variable=ID '=' value=Expression;

Loop:
    'loop' condition=Expression '{' (body+=Statement)* '}';

Condition:
    'if' condition=Expression '{' (thenBlock+=Statement)* '}' 
    ('else' '{' (elseBlock+=Statement)* '}')?;

// ============================================
// COMMANDS
// ============================================

Command:
    SetSpeed | Movement | Rotation | FunctionCall;

Movement:
    direction=('Forward' | 'Backward' | 'Left' | 'Right') distance=Expression 'in' unit=('cm' | 'mm');

Rotation:
    direction=('Clock' | 'CounterClock') angle=Expression;

SetSpeed:
    'setSpeed' '(' speed=Expression 'in' unit=('cm' | 'mm') ')';

FunctionCall:
    functionName=ID '(' (arguments+=Expression (',' arguments+=Expression)*)? ')';

// ============================================
// EXPRESSIONS (with operator precedence)
// ============================================

Expression:
    ComparisonExpression;

ComparisonExpression infers Expression:
    AdditiveExpression ({infer ComparisonExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=AdditiveExpression)*;

AdditiveExpression infers Expression:
    MultiplicativeExpression ({infer ArithmeticExpression.left=current} operator=('+' | '-') right=MultiplicativeExpression)*;

MultiplicativeExpression infers Expression:
    UnaryExpression ({infer ArithmeticExpression.left=current} operator=('*' | '/' | '%') right=UnaryExpression)*;

UnaryExpression infers Expression:
    {infer UnaryExpression} operator=('-' | '!') operand=PrimaryExpression |
    PrimaryExpression;

PrimaryExpression infers Expression:
    '(' Expression ')' |
    NumberLiteral | 
    BooleanLiteral | 
    SensorRead | 
    VariableReference;

NumberLiteral:
    value=NUMBER;

BooleanLiteral:
    value?='true' | 'false';

VariableReference:
    variableName=ID;

SensorRead:
    'getTimestamp' '(' ')' |
    'getDistance' '(' ')' 'in' unit=('cm' | 'mm');

// ============================================
// TERMINALS
// ============================================

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;