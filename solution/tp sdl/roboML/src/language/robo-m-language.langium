grammar RoboMLanguage
import 'Terminals'
import 'tp_sdl-types'

// ============================================
// ENTRY POINT
// ============================================

entry Program returns Program:
    (functions+=FunctionDeclaration)*
    entry=EntryFunction
    (functions+=FunctionDeclaration)*;

// ============================================
// FUNCTIONS
// ============================================


EntryFunction returns MyFunction:
    'let' returnType=ReturnType 'entry' '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' 
    '{' (body+=Statement)* '}'
;

FunctionDeclaration returns MyFunction:
    'let' returnType=ReturnType name=ID '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' 
    '{' (body+=Statement)* '}'
;

Parameter returns Parameter:
    type=VariableType name=ID
;

// ============================================
// STATEMENTS
// ============================================

Statement returns Statement:
    VariableDeclaration | Assignment | Loop | Condition | Command;

// --- Variable Declaration
VariableDeclaration returns VariableDeclaration:
    'var' type=VariableType name=ID ('=' initialValue=ComparisonExpression)?
;

// --- Assignment
Assignment returns Assignment:
    variable=ID '=' value=ComparisonExpression
;

// --- Loop
Loop returns Loop:
    'loop' condition=ComparisonExpression '{' (body+=Statement)* '}'
;

// --- Conditional
Condition returns Condition:
    'if' condition=ComparisonExpression '{' (thenBlock+=Statement)* '}' 
    ('else' '{' (elseBlock+=Statement)* '}')?
;

// ============================================
// COMMANDS
// ============================================

Command returns Command:
    SetSpeed | Movement | Rotation | FunctionCall;

// --- Movement
Movement returns Movement:
    direction=Direction distance=ComparisonExpression 'in' unit=DistanceUnit
;

// --- Rotation
Rotation returns Rotation:
    direction=RotationDirection angle=ComparisonExpression
;

// --- SetSpeed
SetSpeed returns SetSpeed:
    'setSpeed' '(' speed=ComparisonExpression 'in' unit=SpeedUnit ')'
;

// --- FunctionCall
FunctionCall returns FunctionCall:
    functionName=ID '(' (arguments+=ComparisonExpression (',' arguments+=ComparisonExpression)*)? ')'
;

// ============================================
// EXPRESSIONS (PROPER HIERARCHY WITH PRECEDENCE)
// ============================================

// Top level expression entry point
Expression returns Expression:
    ComparisonExpression
;

// Level 1: Comparison (lowest precedence, returns boolean)
ComparisonExpression returns Expression:
    AdditiveExpression ({ComparisonExpression.left=current} 
    operator=ComparisonOperator right=AdditiveExpression)*
;

// Level 2: Additive (PLUS, MINUS) - medium precedence
AdditiveExpression returns Expression:
    MultiplicativeExpression ({ArithmeticExpression.left=current} 
    operator=(ArithmeticOperator_PLUS | ArithmeticOperator_MINUS) 
    right=MultiplicativeExpression)*
;

// Level 3: Multiplicative (MULTIPLY, DIVIDE, MODULO) - higher precedence
MultiplicativeExpression returns Expression:
    UnaryExpression ({ArithmeticExpression.left=current} 
    operator=(ArithmeticOperator_MULTIPLY | ArithmeticOperator_DIVIDE | ArithmeticOperator_MODULO) 
    right=UnaryExpression)*
;

// Level 4: Unary (MINUS, NOT) - highest operator precedence
UnaryExpression returns Expression:
    {UnaryExpression} operator=UnaryOperator operand=PrimaryExpression
    | PrimaryExpression
;

// Level 5: Primary expressions (atoms and parentheses)
PrimaryExpression returns Expression:
    '(' Expression ')'
    | NumberLiteral
    | BooleanLiteral  
    | SensorRead
    | VariableReference
;

// --- Literals & References
NumberLiteral returns NumberLiteral:
    value=EDouble
;

EDouble returns number:
    '-'? INT ('.' INT)? (('E' | 'e') '-'? INT)?
;

BooleanLiteral returns BooleanLiteral:
    value?='true' | 'false'
;

VariableReference returns VariableReference:
    variableName=ID
;

SensorRead returns SensorRead:
    'getTimestamp' '(' ')' |
    'getDistance' '(' ')' 'in' unit=DistanceUnit
;

// ============================================
// OPERATOR SEPARATORS (for proper precedence)
// ============================================

// Separate additive operators (lower precedence)
AdditiveOperator returns ArithmeticOperator:
    ArithmeticOperator_PLUS | ArithmeticOperator_MINUS
;

// Separate multiplicative operators (higher precedence)
MultiplicativeOperator returns ArithmeticOperator:
    ArithmeticOperator_MULTIPLY | ArithmeticOperator_DIVIDE | ArithmeticOperator_MODULO
;

// ============================================
// ECORE ENUM / TYPE WRAPPERS
// ============================================

ReturnType returns ReturnType:
    ReturnType_VOID | ReturnType_NUMBER | ReturnType_BOOLEAN
;
ReturnType_VOID returns ReturnType_VOID: 'VOID';
ReturnType_NUMBER returns ReturnType_NUMBER: 'NUMBER';
ReturnType_BOOLEAN returns ReturnType_BOOLEAN: 'BOOLEAN';

VariableType returns VariableType:
    VariableType_NUMBER | VariableType_BOOLEAN
;
VariableType_NUMBER returns VariableType_NUMBER: 'NUMBER';
VariableType_BOOLEAN returns VariableType_BOOLEAN: 'BOOLEAN';

Direction returns Direction:
    Direction_FORWARD | Direction_BACKWARD | Direction_LEFT | Direction_RIGHT
;
Direction_FORWARD returns Direction_FORWARD: 'FORWARD' ;
Direction_BACKWARD returns Direction_BACKWARD: 'BACKWARD' ;
Direction_LEFT returns Direction_LEFT: 'LEFT' ;
Direction_RIGHT returns Direction_RIGHT: 'RIGHT' ;

RotationDirection returns RotationDirection:
    RotationDirection_CLOCK | RotationDirection_COUNTERCLOCK
;
RotationDirection_CLOCK returns RotationDirection_CLOCK: 'CLOCK';
RotationDirection_COUNTERCLOCK returns RotationDirection_COUNTERCLOCK: 'COUNTERCLOCK';

DistanceUnit returns DistanceUnit:
    DistanceUnit_CM | DistanceUnit_MM
;
DistanceUnit_CM returns DistanceUnit_CM: 'CM';
DistanceUnit_MM returns DistanceUnit_MM: 'MM';

SpeedUnit returns SpeedUnit:
    SpeedUnit_MM_PER_SEC | SpeedUnit_CM_PER_SEC
;
SpeedUnit_MM_PER_SEC returns SpeedUnit_MM_PER_SEC: 'MM_PER_SEC';
SpeedUnit_CM_PER_SEC returns SpeedUnit_CM_PER_SEC: 'CM_PER_SEC';

ArithmeticOperator returns ArithmeticOperator:
    ArithmeticOperator_PLUS | ArithmeticOperator_MINUS | ArithmeticOperator_MULTIPLY | ArithmeticOperator_DIVIDE | ArithmeticOperator_MODULO
;
ArithmeticOperator_PLUS returns ArithmeticOperator_PLUS: 'PLUS' ;
ArithmeticOperator_MINUS returns ArithmeticOperator_MINUS: 'MINUS' ;
ArithmeticOperator_MULTIPLY returns ArithmeticOperator_MULTIPLY: 'MULTIPLY' ;
ArithmeticOperator_DIVIDE returns ArithmeticOperator_DIVIDE: 'DIVIDE' ;
ArithmeticOperator_MODULO returns ArithmeticOperator_MODULO: 'MODULO' ;

ComparisonOperator returns ComparisonOperator:
    ComparisonOperator_LESS | ComparisonOperator_LESS_EQ | ComparisonOperator_GREATER | ComparisonOperator_GREATER_EQ | ComparisonOperator_EQUALS | ComparisonOperator_NOT_EQUALS
;
ComparisonOperator_LESS returns ComparisonOperator_LESS: 'LESS' ;
ComparisonOperator_LESS_EQ returns ComparisonOperator_LESS_EQ: 'LESS_EQ' ;
ComparisonOperator_GREATER returns ComparisonOperator_GREATER: 'GREATER' ;
ComparisonOperator_GREATER_EQ returns ComparisonOperator_GREATER_EQ: 'GREATER_EQ' ;
ComparisonOperator_EQUALS returns ComparisonOperator_EQUALS: 'EQUALS' ;
ComparisonOperator_NOT_EQUALS returns ComparisonOperator_NOT_EQUALS: 'NOT_EQUALS' ;

UnaryOperator returns UnaryOperator:
    UnaryOperator_MINUS | UnaryOperator_NOT
;
UnaryOperator_MINUS returns UnaryOperator_MINUS: 'MINUS';
UnaryOperator_NOT returns UnaryOperator_NOT: 'NOT';

SensorType returns SensorType:
    SensorType_TIMESTAMP | SensorType_DISTANCE
;
SensorType_TIMESTAMP returns SensorType_TIMESTAMP: 'TIMESTAMP';
SensorType_DISTANCE returns SensorType_DISTANCE: 'DISTANCE';