
type ReturnType = ReturnType_VOID | ReturnType_NUMBER | ReturnType_BOOLEAN;
type ReturnType_VOID = 'VOID';
type ReturnType_NUMBER = 'NUMBER';
type ReturnType_BOOLEAN = 'BOOLEAN';

type VariableType = VariableType_NUMBER | VariableType_BOOLEAN;
type VariableType_NUMBER = 'NUMBER';
type VariableType_BOOLEAN = 'BOOLEAN';

type Direction = Direction_FORWARD | Direction_BACKWARD | Direction_LEFT | Direction_RIGHT;
type Direction_FORWARD = 'FORWARD';
type Direction_BACKWARD = 'BACKWARD';
type Direction_LEFT = 'LEFT';
type Direction_RIGHT = 'RIGHT';

type DistanceUnit = DistanceUnit_CM | DistanceUnit_MM;
type DistanceUnit_CM = 'CM';
type DistanceUnit_MM = 'MM';

type RotationDirection = RotationDirection_CLOCK | RotationDirection_COUNTERCLOCK;
type RotationDirection_CLOCK = 'CLOCK';
type RotationDirection_COUNTERCLOCK = 'COUNTERCLOCK';

type SpeedUnit = SpeedUnit_MM_PER_SEC | SpeedUnit_CM_PER_SEC;
type SpeedUnit_MM_PER_SEC = 'MM_PER_SEC';
type SpeedUnit_CM_PER_SEC = 'CM_PER_SEC';

type SensorType = SensorType_TIMESTAMP | SensorType_DISTANCE;
type SensorType_TIMESTAMP = 'TIMESTAMP';
type SensorType_DISTANCE = 'DISTANCE';

type ArithmeticOperator = ArithmeticOperator_PLUS | ArithmeticOperator_MINUS | ArithmeticOperator_MULTIPLY | ArithmeticOperator_DIVIDE | ArithmeticOperator_MODULO;
type ArithmeticOperator_PLUS = 'PLUS';
type ArithmeticOperator_MINUS = 'MINUS';
type ArithmeticOperator_MULTIPLY = 'MULTIPLY';
type ArithmeticOperator_DIVIDE = 'DIVIDE';
type ArithmeticOperator_MODULO = 'MODULO';

type ComparisonOperator = ComparisonOperator_LESS | ComparisonOperator_LESS_EQ | ComparisonOperator_GREATER | ComparisonOperator_GREATER_EQ | ComparisonOperator_EQUALS | ComparisonOperator_NOT_EQUALS;
type ComparisonOperator_LESS = 'LESS';
type ComparisonOperator_LESS_EQ = 'LESS_EQ';
type ComparisonOperator_GREATER = 'GREATER';
type ComparisonOperator_GREATER_EQ = 'GREATER_EQ';
type ComparisonOperator_EQUALS = 'EQUALS';
type ComparisonOperator_NOT_EQUALS = 'NOT_EQUALS';

type UnaryOperator = UnaryOperator_MINUS | UnaryOperator_NOT;
type UnaryOperator_MINUS = 'MINUS';
type UnaryOperator_NOT = 'NOT';

interface Program {
	entry: MyFunction
	functions: MyFunction[]
}

interface MyFunction {
	name?: string
	returnType?: ReturnType
	parameters: Parameter[]
	body: Statement[]
}

interface Parameter {
	name?: string
	^type?: VariableType
}

interface Statement {
}

interface Expression {
}

interface VariableDeclaration extends Statement {
	name?: string
	^type?: VariableType
	initialValue?: Expression
}

interface Assignment extends Statement {
	variable?: string
	value: Expression
}

interface Loop extends Statement {
	condition: Expression
	body: Statement[]
}

interface Condition extends Statement {
	condition: Expression
	thenBlock: Statement[]
	elseBlock: Statement[]
}

interface Movement extends Command {
	direction?: Direction
	unit?: DistanceUnit
	distance: Expression
}

interface Command extends Statement {
}

interface Rotation extends Command {
	direction?: RotationDirection
	angle: Expression
}

interface SetSpeed extends Command {
	unit?: SpeedUnit
	speed: Expression
}

interface FunctionCall extends Command {
	functionName?: string
	arguments: Expression[]
}

interface NumberLiteral extends Expression {
	value?: number
}

interface BooleanLiteral extends Expression {
	value: boolean
}

interface VariableReference extends Expression {
	variableName?: string
}

interface SensorRead extends Expression {
	sensor?: SensorType
	unit?: DistanceUnit
}

interface UnitExpression extends Expression {
	unit?: DistanceUnit
	value: Expression
}

interface ArithmeticExpression extends BinaryExpression {
	operator?: ArithmeticOperator
}

interface BinaryExpression extends Expression {
	left: Expression
	right: Expression
}

interface ComparisonExpression extends BinaryExpression {
	operator?: ComparisonOperator
}

interface UnaryExpression extends Expression {
	operator?: UnaryOperator
	operand: Expression
}

