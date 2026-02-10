# Labs on Domain-Specific Languages (DSL)



These lab sessions are to be realized in groups of two.

## Overall objectives of the lab

During these lab sessions, you will create your own version of RoboML, a language to define the behavior of a small robot. Building the DSL will include modeling the domain (*i.e.*, the concepts and their relationships), and implements the associated tooling: *e.g.*, the text editor and its services, an interpreter (through a web-based simulator) and a compiler (to Arduino code that will run on the robot itself).

Below, you can find an example of a program that we expect to write in your language.

```
let void entry () {
    setSpeed(150 in mm) // distance per second (here 150mm/s)
    var number count = 0
    loop count < 5
    {	
        count = count + 1
        square()
    }
}

let void square(){
    Forward 30 in cm
    Clock 90
    Forward 300 in mm
    Clock 90
    Forward 30 in cm
    Clock 90
    Forward 300 in mm
    Clock 90
}
```

The above program, when executed, should set the speed of the robot and then perform 5 times (loop) a square pattern movement (square function).

The robot used for this lab has four wheels with individual motors, and an ultrasound sensor which can be used to measure distance to an object in front. We expect your language to mostly follow the imperative programming paradigm, with basic arithmetic and commands for the robot.

## Evaluation

These labs are split into three parts corresponding to the three main aspects of DSLs implementation: abstract syntax, concrete syntax, and semantics.

The lab sessions for this course will consist in the realization of these aspects. After each major step, you will need to showcase your work to your lab teacher through a small demonstration, which will be used to grade you. You can only move on to the next step once the teacher has validated the current part.

To encourage you to finish completely at least one of the two possible semantics, yet exploring both compilation and interpretation, you will have to choose a major and a minor semantics.
The major semantics will be used to evaluate your project.
The minor one is not mandatory but can give you bonus points.
The evaluation grid is the following:
- Abstract syntax: 5
- Concrete Syntax: 5
- Semantics: 10

## Part 1 - Domain modeling: definition of the language's metamodel with Ecore

The first step in defining a language is to model the concepts and their relationships in the domain targeted by your language. 
This results in the creation of the language's metamodel, defining its abstract syntax.
For this part, you can pick any tool you want: the Ecore framework, an online UML editor, or even simply a pen and a piece of paper!

If you chose Ecore, there are some instructions below to help with the technical aspect.

There is a short list of mandatory concepts that we want:
- Movement (front, back, sides)
- Rotation
- Speed
- Sensors (time, distance to obstacle in front of the robot)
- Units (*e.g.*, cm, mm)
- Basic arithmetic and boolean expressions
- Control structure (loop, conditions)
- Functions and variables

**N.B.:** For units, you can either implement it as "cast function" or as a concrete type in the language.
> For units, you can either implement it as "cast function" or as a concrete type in the language.  
As a cast -> `var number length = 10 in cm`.  
As a type -> `var cm length = 10`.

### Ecore modeling

Within your Eclipse RCP that includes EMF, Xtext, and Xtend (e.g., [Eclipse DSL](https://www.eclipse.org/downloads/packages/release/2024-12/r/eclipse-ide-java-and-dsl-developers) with the added [Ecore tools](https://projects.eclipse.org/projects/modeling.emft.ecoretools) which you can install with _Help_ -> _Eclipse Marketplace..._ -> search for `ecoretools`), create an _Ecore Modeling Project_. Then you can start modeling your domain as an object-oriented metamodel, which should represent the different concepts of your language and how they are related.

You may validate your metamodel by right-clicking on your ecore model and then clicking on _Validate_.

When this is done, you can generate the Java-based implementation of your domain model by opening the associated `genmodel` file, right-clicking on the root element, and _Generate all_. This is not mandatory to continue the lab.

You may assess the expressivity of your metamodel (*i.e.*, check if it captures your domain well, in your case meaning it supports the modeling of the proposed example) by opening the Ecore metamodel, right-click on the concept of the root element of your expected model, and choose _Create dynamic instance_. Then you can create a model in a tree-based editor, and ensure your metamodel supports the expected model structure. 

## Part 2 - Textual modeling: definition of the Langium grammar and editor for your language

After determining the domain, it is time to move on to the actual text editor for your language. In this lab, we will build this editor using the TypeScript-based [Langium](https://langium.org/) workbench to build a Visual Studio Code extension supporting the edition of your language.

If not done already, you will need to install a [node environment](https://nodejs.org/en/download) as well as [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview), and then run the command `npm i -g yo@5.1.0 generator-langium@3.3.0` to install the Langium project generator. Then, run `yo langium` to create the project. This will offer to create a few different things; you **have to** say yes to all of them, pick a language name, extension name, and a file extension (*e.g.* .rob).
You can also install the Langium extension from the VSCode marketplace, to have syntax highlighting and validation in your grammar.

> [!IMPORTANT]
> We use a particular version of yo and generator-langium in these labs due to the rapid change in the version of Langium.
> **Make sure that you use these versions**.

Depending on what modeling tool you picked in Part 1, the next step can change a little bit. If you picked another method than Ecore, skip the following section.

> [!NOTE]
> There is flexibility in the concrete syntax of the language, but make it concise and usable for non-experts in programming. Ask your teacher during labs if you plan to change the syntax.

### Ecore modeling

If you decided to model your domain using Ecore and Eclipse in the previous part, you may be aware that it is possible to generate an Xtext project from an Ecore project (by creating a new _Xtext Project From Existing Ecore Models_). After creation you must convert the metamodel to Xtext Project (right click on the metamodel -> _Configure_ -> _Convert to Xtext Project_). Fortunately, it is possible to convert an Xtext grammar into a Langium grammar thanks to [this project](https://github.com/TypeFox/xtext2langium). You can thus write your grammar using Xtext rather than Langium if you so wish.

To convert a grammar, go to the Eclipse menu _Help_ -> _Install new software_ -> in the site field, paste the URL `https://typefox.github.io/xtext2langium/download/updates/v0.4.0/` and install the package. Afterward, go into your Xtext project's `META-INF/MANIFEST.MF`, switch to the _Dependencies_ tab, and add Xtext2langium as a dependency. Don't forget to save your manifest file. Then you can go to the MWE2 file (named something like `GenerateMyDsl.mwe2`) in your project, and replace the `fragment` field with:

```
fragment = io.typefox.xtext2langium.Xtext2LangiumFragment {
        outputPath = './langium'
    }
```

Right-click the MWE2 file and run it. You should see a `langium` folder appear in your project, with corresponding `.langium` grammar files which you can put into your `src/language/` folder of the Langium project. Make sure the grammars names match up between your projects, otherwise you will have to manually refactor the conflicts.

### Other types of modeling

Since you have previously modeled your domain, we need to translate that modeling effort into a metamodel that can be understood by Langium. This can be done by inserting TypeScript-like interfaces in the grammar, the full specification of which can be seen [here](https://langium.org/docs/reference/semantic-model/#declared-types). As an example, this could be the model used for a Finished State Machine language:

```ts
interface StateMachine {
    name: string
    states: State[]
    transitions: Transition[]
    initialState: State
}

interface State {
    name: string
    output: string
}

interface Transition {
    name: string
    input: string
    start: @State
    target: @State
}
```

You can then write the textual grammar rules that will return your specified types.

### VSCode extension with Langium

Once you have a valid [Langium grammar](https://langium.org/docs/grammar-language/), you can launch the commands `npm run langium:generate` and `npm run build` to build the project.

You can test your editor as you make changes either by launching the command `code --extensionDevelopmentPath=$PWD`, or by starting a debug session in VSCode, both of which will open a VSCode instance with your extension loaded in. You can create examples and test files for your language in this instance. A goal for this part can be to have your language parse the examples given in this document, such as the following:

```
let void entry () {
    setSpeed(200 mm) // distance per second (here 200mm/s)
    var number time = getTimestamp()
    loop time < 60000
    {
        var number dist = getDistance() in cm
        Forward dist - 25 in cm
        Clock 90
        time = getTimestamp()
    }
}
```

> [!NOTE]
> If you have made changes to the syntax, the equivalent AST with your syntax is your test.

### How to verify my grammar?

When the grammar grows, it may be difficult to verify if your grammar is valid.
Even by testing your language, you cannot ensure your AST is built as you want.
To help language designers with this task, Langium provides two different tools.

The first one is directly accessible from the Langium VSCode extension, by typing `>railroad` in the quick access (CTRL + SHIFT + P) and clicking on "Langium: Show Railroad Syntax Diagram". 
This will open a new panel and display you your grammar in a graphical way. 
It allows you to verify your grammar at a higher level.

![railroad](./images/railroad.png)

The second one is accessible from the Langium website, on the [`Playground` page](https://langium.org/playground/).
Here you can paste your grammar (without forgetting to also past your types and terminals, and removing your imports) and a program conforms to the grammar.
By clicking on the "Tree" icon, you can open a new panel displaying the abstract syntax tree of your program, in JSON.
However be aware, the playground has sometimes some refresh issues so the program text editor may be not synchronized anymore with the grammar one.

![playground](./images/playground.png)


## Part 3 - Executable modeling

In the previous steps, you have first identified the core concepts of your language and implemented a textual syntax to define instances of those concepts. 
By now, your programs should be parsable, which means Langium will be able to give you an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) representing your programs. 
The next step is to try and execute those model instances: this can be done either through interpretation or compilation. You will need to implement these in a `compiler.ts` and `interpreter.ts` file (take a look at the `generator.ts` in the cli folder), which you should put in a new `src/semantics/` folder.

To execute the program, you will use the [visitor design pattern](https://en.wikipedia.org/wiki/Visitor_pattern) to implement a compiler targeting the Arduino language (allowing the execution on a real robot) and an interpreter directly executing the program.
The visitor pattern allows you to split the language definition into two parts: the syntax (abstract syntax defined through the metamodel and concrete syntax defined by the grammar), and the semantics (interpreter and compiler), easing the extension/evolution of the language semantics.
Each method implemented in a visitor represents the semantics of a concept, often relying on the semantics of its child in the AST.

Langium does not provide a visitor pattern by default.
To avoid creating the pattern manually, you can use an external library: [langium-visitor](https://www.npmjs.com/package/langium-visitor).
To use it, you will need to install it in your project with `npm i -D langium-visitor`.
You can then add a new script command in your `package.json` file to generate the visitor: `"langium:visitor": "langium-visitor"`.
The library will use the JSON grammar compiled by Langium from your `.langium` files to automatically generate the visitor interfaces.
More information about how to plug the visitor into your Langium project can be found on the [Github repository](https://github.com/theogiraudet/langium-visitor).

### Interpretation: 

In this lab, your interpreter will run on a web-based simulator for the robot written in JavaScript.
You will find in the interpreter folder of this repository, the code of the simulator provided for this part of the lab.
The Typescript files in the `src/web/simulator` folder represent the elements of the simulation used in your interpreter.
Especially, you will find the *Robot* class that will be manipulated by your interpreter.
In addition, you will find the scene classes representing the environment in which the robot evolves.  
The scene **REQUIRES** you to add timestamp objects recording the steps of the simulation to replay it on the web page.  
The TypeScript files in the `src/web/lib` folder are used to display the simulation on the web page and should only be used on the client side.
This TypeScript code expects to receive the final state of the scene simulated.
The `static` folder needs to be merged with the `static` folder of Langium and the `index.html` files must replace the existing one.
Finally, we use P5 to render the simulation in the browser, so you have to install it:

```bash
npm i p5@1.11.3
npm i -D @types/p5@1.7.6
```

To understand how to create the communication between the LSP server and the client, we propose you to first create a 'parseAndValidate' LSP action.
The general idea of the 'parseAndValidate' action can be found [here](https://web.archive.org/web/20230323045804/https://langium.org/tutorials/customizing_cli/), while the code required to define new LSP action usable in the web is detailed [here](https://web.archive.org/web/20230323041439/https://langium.org/tutorials/generation_in_the_web/).
However, the documentation for the web part is currently outdated for the latest version of Langium.
Instead of it, you can add this code in the `src/setupClassic.ts` file:

```ts
function getDocumentUri(wrapper: MonacoEditorLanguageClientWrapper): string {
    return wrapper.getModel()!.uri.toString();
}

// At the end of `executeClassic`
const client = wrapper.getLanguageClient();
if (!client) {
    throw new Error('Unable to obtain language client!');
}

setup(client, getDocumentUri(wrapper)); // setup function of the setup.ts file
```

You will find an example of communication between the client and the server from the client's perspective in the `setup.ts` file (lines 101 and 105).

On the server side, we need to modify the function `src/language/main-browser.ts` by adding this code at the end of the file:

```ts
function getModelFromUri(uri: string): <YourRootConceptFromVisitor> | undefined {
    const document = shared.workspace.LangiumDocuments.getDocument(URI.parse(uri));
    if(document && document.diagnostics === undefined || document?.diagnostics?.filter((i) => i.severity === 1).length === 0) {
        return document.parseResult.value as <YourRootConceptFromVisitor>;
    }
    return undefined;
}

connection.onNotification("custom/hello", (uri: string) => connection.sendNotification("custom/hello", "World"));
```

Here, we are listening a notification with the method `custom/hello`. When received, we are sending "World" to the client on the same method.
The client will display `Hello World!` in the console.
For your own code, you can replace the `"World"` by a call to your visitor.
The method `getModelFromUri`, enables, from a document URI, to get your root concept or `undefined` if the program is not valid.
Even if it is not used in this example, you can use it for your own code.

Finally, you can execute `npm run serve` to run your server/client architecture, and go to the printed URL to test your application.

### Compilation:

Since the objective of this lab is to be able to program a small four-wheeled robot using your language, you will need to be able to compile your code to something the robot can understand - in this case, the robot uses an Arduino card, which can be programmed using a [subset of C](https://www.arduino.cc/reference/en/). You will need to write a compiler that generates Arduino code based on the defined model.

To test your compiler, you will need the [Arduino IDE](https://www.arduino.cc/en/software). At first, you will not need the robot and just verify that the generated code is valid (Verify action in Arduino IDE).
When your generator generates valid Arduino programs, ask your teacher the robot to verify the correct (or not) behavior.

In the same idea as an interpreter, a compiler can also be implemented using a visitor pattern - but instead of directly simulating the behavior, you will generate the Arduino code representing this behavior.


As previously, you can put your visitor in the semantics folder. You can then use your compiler by adding a new command to the Command Line Interface provided by Langium, which will be the entry point from which you call the rest of your functions. Registering new commands can be done in `src/cli/main.ts`; once that is done, you should be able to call `./bin/cli.js compile <source>` (or `node ./bin/cli.js compile <source>`) in your terminal and have it generate Arduino code corresponding to the source program given as argument.

To understand how to call the semantics from the command line, we propose you to first create a 'parseAndValidate' action.
The description of the 'parseAndValidate' action can be found [here](https://langium.org/docs/learn/minilogo/customizing_cli/) ([archive](https://web.archive.org/web/20240916195444/https://langium.org/docs/learn/minilogo/customizing_cli/)).
After that, you will be able to call your visitor in a 'generate' action.

You will find in the `Compiler` folder an example of code to control the robot.
The global structure of this program will not require many changes.
If you want details on the possible actions, go look at the definition of the `demoAction` function used in the example, it uses most of the possible movements.
> You can find it in the MotorWheel lib, in the `Omni4WD.cpp` file

> [!WARNING]
> This robot requires non-classical libraries, you will have to add them.
> Copy the folders in the `compiler/Arduino Example/lib/` folder in the `libraries` folder of your Arduino IDE.

## Known issues

### No run configuration when trying to generate the Langium grammar from the Xtext one

**Have you installed the Eclipse plugin?**  
**Have you added the plugin to your Xtext project?**  
**Have you modified the `.mwe2` file?**  

If yes to all the questions, so you have to uninstall the MWE2 SDK and reinstall it.
For that:
- Go to Help → About Eclipse IDE
- Click on "Installation Details"
- Search for "MWE2 Language SDK" and uninstall it
- Confirm the different steps until Eclipse is restarted
- Go to Help → Install New Software…
- On "Work with", choose `2024-12 - https://download.eclipse.org/releases/2024-12`
- Search for MWE SDK and install it
- Confirm the different steps until Eclipse is restarted
Then, it should work.

### Some grammar rules are not generated in my Xtext grammar

At the creation of the Xtext project, when choosing your metamodel, be aware to correctly select your root concept in the drop-down list.

### The comments of the generated Langium grammar don't work

The Xtext to Langium plugin seems to badly generate the comment rules.
To fix that, remove the ones generated by the plugin in your terminal Langium file (`SL_COMMENT` and `ML_COMMENT`) and replace them with the following:

```
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
```

### In Langium, my cross-references don't work even if the grammar looks correct

This may be linked to how Langium resolves the cross-references (the linking step).
By default, a named element (instance of a concept with an attribute `name`) is visible to all the elements that are (transitive) children of its container.
If there's an element in the middle of A and the elements you want A to be accessible, so merge the concept of A and its container.

![scope](./images/scope.png)

### The `langium-visitor` visitor is not found

This error occurs only on Windows computers.
To resolve the problem, install `langium-visitor` in global:

```bash
npm i -g langium-visitor
```
---
---
---
---

# 📚 RoboML Metamodel - Complete Documentation

## 📊 Complete Class Diagram (Mermaid)

```mermaid
classDiagram
    %% ============================================
    %% ROOT CLASS
    %% ============================================
    class Program {
        <<root>>
         + Function entry
         + Function[0..*] functions
    }
    
    %% ============================================
    %% FUNCTION & PARAMETER
    %% ============================================
    class Function {
        +String name
        +ReturnType returnType
        +Parameter[0..*] parameters
        +Statement[0..*] body
    }

    class Parameter {
        +String name
        +VariableType type
    }

    %% ============================================
    %% STATEMENT HIERARCHY
    %% ============================================
    class Statement {
        <<abstract>>
    }

    class VariableDeclaration {
        +String name
        +VariableType type
        +Expression[0..1] initialValue
    }

    class Assignment {
        +String variable
        +Expression[1] value
    }

    class Loop {
        +Expression[1] condition
        +Statement[0..*] body
    }

    class Condition {
        +Expression[1] condition
        +Statement[0..*] thenBlock
        +Statement[0..*] elseBlock
    }

    %% ============================================
    %% COMMAND HIERARCHY
    %% ============================================
    class Command {
        <<abstract>>
    }

    class Movement {
        +Direction direction
        +DistanceUnit unit
        +Expression[1] distance
    }

    class Rotation {
        +RotationDirection direction
        +Expression[1] angle
    }

    class SetSpeed {
        +SpeedUnit unit
        +Expression[1] speed
    }

    class FunctionCall {
        +String functionName
        +Expression[0..*] arguments
    }

    %% ============================================
    %% EXPRESSION HIERARCHY
    %% ============================================
    class Expression {
        <<abstract>>
    }

    class NumberLiteral {
        +double value
    }

    class BooleanLiteral {
        +boolean value
    }

    class VariableReference {
        +String variableName
    }

    class SensorRead {
        +SensorType sensor
        +DistanceUnit[0..1] unit
    }

    class UnitExpression {
        +DistanceUnit unit
        +Expression[1] value
    }

    class BinaryExpression {
        <<abstract>>
        +Expression[1] left
        +Expression[1] right
    }

    class ArithmeticExpression {
        +ArithmeticOperator operator
        +Expression[1] left
        +Expression[1] right
    }

    class ComparisonExpression {
        +ComparisonOperator operator
        +Expression[1] left
        +Expression[1] right
    }

    class UnaryExpression {
        +UnaryOperator operator
        +Expression[1] operand
    }

    %% ============================================
    %% ENUMERATIONS
    %% ============================================
    class ReturnType {
        <<enum>>
        VOID
        NUMBER
        BOOLEAN
    }

    class VariableType {
        <<enum>>
        NUMBER
        BOOLEAN
    }

    class Direction {
        <<enum>>
        FORWARD
        BACKWARD
        LEFT
        RIGHT
    }

    class RotationDirection {
        <<enum>>
        CLOCK
        COUNTERCLOCK
    }

    class DistanceUnit {
        <<enum>>
        CM
        MM
    }

    class SpeedUnit {
        <<enum>>
        MM_PER_SEC
        CM_PER_SEC
    }

    class ArithmeticOperator {
        <<enum>>
        PLUS
        MINUS
        MULTIPLY
        DIVIDE
        MODULO
    }

    class ComparisonOperator {
        <<enum>>
        LESS
        LESS_EQ
        GREATER
        GREATER_EQ
        EQUALS
        NOT_EQUALS
    }

    class UnaryOperator {
        <<enum>>
        MINUS
        NOT
    }

    class SensorType {
        <<enum>>
        TIMESTAMP
        DISTANCE
    }

    %% ============================================
    %% RELATIONSHIPS (ONLY ARROWS)
    %% ============================================
    
    %% Program relationships
    Program "1" --> "1" Function : entry
    Program "1" --> "0..*" Function : functions
    UnaryExpression "1" *-- "1" Expression : operand
    BinaryExpression "1" *-- "1" Expression : left
    BinaryExpression "1" *-- "1" Expression : right
    UnitExpression "1" *-- "1" Expression : value
    FunctionCall "1" *-- "0..*" Expression : arguments
    SetSpeed "1" *-- "1" Expression : speed
    Rotation "1" *-- "1" Expression : angle
    Movement "1" *-- "1" Expression : distance
    Condition "1" *-- "1" Expression : condition
    Condition "1" *-- "0..*" Statement : thenBlock
    Condition "1" *-- "0..*" Statement : elseBlock
    Loop "1" *-- "1" Expression : condition
    Loop "1" *-- "0..*" Statement : body
    Assignment "1" *-- "1" Expression : value
    VariableDeclaration "1" *-- "0..1" Expression : initialValue
    Function "1" *-- "0..*" Parameter : parameters
    Function "1" *-- "0..*" Statement : body

    %% Statement hierarchy
    Statement <|-- VariableDeclaration
    Statement <|-- Assignment
    Statement <|-- Loop
    Statement <|-- Condition
    Statement <|-- Command

    %% Command hierarchy
    Command <|-- Movement
    Command <|-- Rotation
    Command <|-- SetSpeed
    Command <|-- FunctionCall

    %% Expression hierarchy
    Expression <|-- NumberLiteral
    Expression <|-- BooleanLiteral
    Expression <|-- VariableReference
    Expression <|-- SensorRead
    Expression <|-- UnitExpression
    Expression <|-- BinaryExpression
    Expression <|-- UnaryExpression

    %% BinaryExpression hierarchy
    BinaryExpression <|-- ArithmeticExpression
    BinaryExpression <|-- ComparisonExpression
```

---

## 🏗️ Architecture

The RoboML metamodel is organized into **5 main hierarchies**:

1. **Program Structure** - Root and function definitions
2. **Statements** - Executable instructions (loops, conditions, assignments, commands)
3. **Commands** - Robot-specific actions (movement, rotation, speed control)
4. **Expressions** - Value computations (arithmetic, comparisons, literals)
5. **Enumerations** - Type-safe constants (directions, units, operators)

---

## 📋 Detailed Class Documentation

### 1. Program Structure

#### 🔹 Program (Root Class)

**Purpose:** Entry point of a RoboML program. Contains all function definitions.

**References:**
- `entry: Function [1]` - The main entry function (mandatory)
- `functions: Function [0..*]` - Additional function definitions

**Design Choice:** We separate `entry` from `functions` to make it explicit that every program must have exactly one entry point.

**Example:**
```
Program
├── entry: Function (name="entry")
└── functions[0]: Function (name="square")
```

---

#### 🔹 Function

**Purpose:** Represents a reusable function with parameters and a body of statements.

**Attributes:**
- `name: String` - Function identifier
- `returnType: ReturnType` - Return type (VOID, NUMBER, BOOLEAN)

**References:**
- `parameters: Parameter [0..*]` - Function parameters
- `body: Statement [0..*]` - Function body (sequence of statements)

**Design Choice:** Functions can have zero or more parameters and statements, allowing both simple procedures and complex logic.

**Example:**
```java
Function {
    name = "moveAndTurn"
    returnType = VOID
    parameters = [
        Parameter { name="distance", type=NUMBER },
        Parameter { name="angle", type=NUMBER }
    ]
    body = [
        Movement { direction=FORWARD, distance=... },
        Rotation { direction=CLOCK, angle=... }
    ]
}
```

**Corresponds to:**
```
let void moveAndTurn(number distance, number angle) {
    Forward distance in cm
    Clock angle
}
```

---

#### 🔹 Parameter

**Purpose:** Defines a function parameter.

**Attributes:**
- `name: String` - Parameter name
- `type: VariableType` - Parameter type (NUMBER, BOOLEAN)

**Design Choice:** Parameters are strongly typed to enable compile-time type checking.

**Example:**
```java
Parameter {
    name = "speed"
    type = NUMBER
}
```

**Corresponds to:** `number speed` in function signature

---

### 2. Statement Hierarchy

#### 🔹 Statement (Abstract)

**Purpose:** Base class for all executable instructions.

**Why Abstract?** Cannot be instantiated directly. Provides a common type for all statements, enabling polymorphic collections.

**Concrete Subclasses:**
- `VariableDeclaration`
- `Assignment`
- `Loop`
- `Condition`
- `Command` (and its subclasses)

**Design Choice:** Using an abstract base class allows us to create collections of statements, making it easy to represent a sequence of different instruction types in function body.

---

#### 🔹 VariableDeclaration

**Purpose:** Declares a new variable with optional initialization.

**Attributes:**
- `name: String` - Variable name
- `type: VariableType` - Variable type (NUMBER, BOOLEAN)

**References:**
- `initialValue: Expression [0..1]` - Optional initial value

**Design Choice:** Initial value is optional (`[0..1]`) to support both `var number x` and `var number x = 5`.

**Example:**
```java
VariableDeclaration {
    name = "count"
    type = NUMBER
    initialValue = NumberLiteral { value = 0 }
}
```

**Corresponds to:** `var number count = 0`

---

#### 🔹 Assignment

**Purpose:** Assigns a new value to an existing variable.

**Attributes:**
- `variable: String` - Name of the variable to assign

**References:**
- `value: Expression [1]` - New value (mandatory)

**Design Choice:** We use `String` for variable name rather than a reference to VariableDeclaration. This simplifies the model but requires name resolution during semantic analysis.

**Example:**
```java
Assignment {
    variable = "count"
    value = ArithmeticExpression {
        operator = PLUS
        left = VariableReference { variableName = "count" }
        right = NumberLiteral { value = 1 }
    }
}
```

**Corresponds to:** `count = count + 1`

---

#### 🔹 Loop

**Purpose:** Repeats a block of statements while a condition is true.

**References:**
- `condition: Expression [1]` - Loop condition (must evaluate to boolean)
- `body: Statement [0..*]` - Statements to repeat

**Design Choice:** The condition must always be present (`[1]`), but the body can be empty (`[0..*]`), though an empty loop is useless.

**Example:**
```java
Loop {
    condition = ComparisonExpression {
        operator = LESS
        left = VariableReference { variableName = "count" }
        right = NumberLiteral { value = 5 }
    }
    body = [
        Assignment { variable = "count", value = ... },
        FunctionCall { functionName = "square" }
    ]
}
```

**Corresponds to:**
```
loop count < 5 {
    count = count + 1
    square()
}
```

---

#### 🔹 Condition

**Purpose:** Conditional execution (if-then-else).

**References:**
- `condition: Expression [1]` - Condition to evaluate
- `thenBlock: Statement [0..*]` - Statements if condition is true
- `elseBlock: Statement [0..*]` - Statements if condition is false (optional)

**Design Choice:** Both blocks are `[0..*]` to support:
- if with no statements: `if condition { }`
- if without else: `if condition { ... }`
- if-else: `if condition { ... } else { ... }`

**Example:**
```java
Condition {
    condition = ComparisonExpression {
        operator = GREATER
        left = SensorRead { sensor = DISTANCE, unit = CM }
        right = NumberLiteral { value = 25 }
    }
    thenBlock = [
        Movement { direction = FORWARD, distance = ... }
    ]
    elseBlock = [
        Rotation { direction = CLOCK, angle = ... }
    ]
}
```

**Corresponds to:**
```
if getDistance() in cm > 25 {
    Forward 10 in cm
} else {
    Clock 90
}
```

---

### 3. Command Hierarchy

#### 🔹 Command (Abstract)

**Purpose:** Base class for all robot-specific commands.

**Why Abstract?** Groups all robot actions under a common type, making it easier to extend with new commands.

**Extends:** `Statement`

**Concrete Subclasses:**
- `Movement` - Directional movement
- `Rotation` - Turning
- `SetSpeed` - Speed configuration
- `FunctionCall` - User-defined function invocation

**Design Choice:** Command inherits from Statement, meaning commands can appear anywhere statements are expected (function bodies, loop bodies, condition blocks).

---

#### 🔹 Movement

**Purpose:** Moves the robot in a specific direction.

**Attributes:**
- `direction: Direction` - FORWARD, BACKWARD, LEFT, RIGHT
- `unit: DistanceUnit` - CM or MM

**References:**
- `distance: Expression [1]` - How far to move

**Design Choice:** Direction and unit are attributes (enumerations) for type safety, while distance is an Expression to support both literals (`30`) and variables (`myDistance`).

**Example:**
```java
Movement {
    direction = FORWARD
    unit = CM
    distance = UnitExpression {
        unit = CM
        value = NumberLiteral { value = 30 }
    }
}
```

**Corresponds to:** `Forward 30 in cm`

---

#### 🔹 Rotation

**Purpose:** Rotates the robot.

**Attributes:**
- `direction: RotationDirection` - CLOCK (clockwise) or COUNTERCLOCK (counter-clockwise)

**References:**
- `angle: Expression [1]` - Rotation angle in degrees

**Design Choice:** Angle is always in degrees (no unit attribute needed), simplifying the model.

**Example:**
```java
Rotation {
    direction = CLOCK
    angle = NumberLiteral { value = 90 }
}
```

**Corresponds to:** `Clock 90`

---

#### 🔹 SetSpeed

**Purpose:** Configures the robot's movement speed.

**Attributes:**
- `unit: SpeedUnit` - MM_PER_SEC or CM_PER_SEC

**References:**
- `speed: Expression [1]` - Speed value

**Design Choice:** Speed is always "distance per second", so the unit specifies which distance unit is used.

**Example:**
```java
SetSpeed {
    unit = MM_PER_SEC
    speed = UnitExpression {
        unit = MM
        value = NumberLiteral { value = 150 }
    }
}
```

**Corresponds to:** `setSpeed(150 in mm)` // 150mm/s

---

#### 🔹 FunctionCall

**Purpose:** Invokes a user-defined function.

**Attributes:**
- `functionName: String` - Name of the function to call

**References:**
- `arguments: Expression [0..*]` - Arguments passed to the function

**Design Choice:** FunctionCall extends Command (not just Expression) because in RoboML, function calls can be statements. For functions that return values, they could also be used as expressions.

**Example:**
```java
FunctionCall {
    functionName = "square"
    arguments = []
}
```

**Corresponds to:** `square()`

**With arguments:**
```java
FunctionCall {
    functionName = "moveAndTurn"
    arguments = [
        NumberLiteral { value = 50 },
        NumberLiteral { value = 90 }
    ]
}
```

**Corresponds to:** `moveAndTurn(50, 90)`

---

### 4. Expression Hierarchy

#### 🔹 Expression (Abstract)

**Purpose:** Base class for all value-producing computations.

**Why Abstract?** Cannot be instantiated directly. Expressions always evaluate to a value (number or boolean).

**Concrete Subclasses:**
- Literals: `NumberLiteral`, `BooleanLiteral`
- References: `VariableReference`, `SensorRead`
- Operations: `ArithmeticExpression`, `ComparisonExpression`, `UnaryExpression`
- Unit handling: `UnitExpression`

**Design Choice:** Separating Statement and Expression creates a clear distinction between:
- **Statements**: perform actions (no return value)
- **Expressions**: compute values (return number or boolean)

---

#### 🔹 NumberLiteral

**Purpose:** Represents a numeric constant.

**Attributes:**
- `value: double` - The numeric value

**Design Choice:** Using `double` (floating-point) instead of `int` allows decimal values like `3.14` or `2.5`.

**Example:**
```java
NumberLiteral { value = 42 }
NumberLiteral { value = 3.14159 }
```

**Corresponds to:** `42`, `3.14159`

---

#### 🔹 BooleanLiteral

**Purpose:** Represents a boolean constant.

**Attributes:**
- `value: boolean` - true or false

**Example:**
```java
BooleanLiteral { value = true }
BooleanLiteral { value = false }
```

**Corresponds to:** `true`, `false`

---

#### 🔹 VariableReference

**Purpose:** References the value of a declared variable.

**Attributes:**
- `variableName: String` - Name of the variable

**Design Choice:** Uses String name instead of a direct reference to VariableDeclaration. This simplifies the metamodel.

**Example:**
```java
VariableReference { variableName = "count" }
```

**Corresponds to:** Using `count` in expressions like `count + 1` or `count < 5`

---

#### 🔹 SensorRead

**Purpose:** Reads a value from a robot sensor.

**Attributes:**
- `sensor: SensorType` - TIMESTAMP or DISTANCE
- `unit: DistanceUnit [0..1]` - Optional unit (only for DISTANCE sensor)

**Design Choice:** 
- TIMESTAMP sensor returns milliseconds (no unit needed)
- DISTANCE sensor can return CM or MM (unit required)

**Example:**
```java
SensorRead {
    sensor = TIMESTAMP
    unit = null  // No unit for time
}
```

**Corresponds to:** `getTimestamp()`

```java
SensorRead {
    sensor = DISTANCE
    unit = CM
}
```

**Corresponds to:** `getDistance() in cm`

---

#### 🔹 UnitExpression

**Purpose:** Associates a unit with a numeric expression.

**Attributes:**
- `unit: DistanceUnit` - CM or MM

**References:**
- `value: Expression [1]` - The numeric expression

**Design Choice:** This wrapper pattern allows units to be applied to any expression, not just literals:
- `30 in cm` → UnitExpression wrapping NumberLiteral
- `(count * 2) in mm` → UnitExpression wrapping ArithmeticExpression

**Example:**
```java
UnitExpression {
    unit = CM
    value = NumberLiteral { value = 30 }
}
```

**Corresponds to:** `30 in cm`

**Complex example:**
```java
UnitExpression {
    unit = MM
    value = ArithmeticExpression {
        operator = MULTIPLY
        left = VariableReference { variableName = "distance" }
        right = NumberLiteral { value = 2 }
    }
}
```

**Corresponds to:** `distance * 2 in mm`

---

#### 🔹 BinaryExpression (Abstract)

**Purpose:** Base class for all binary operations (operations with two operands).

**Why Abstract?** Provides common structure (left and right operands) for arithmetic and comparison operations.

**References:**
- `left: Expression [1]` - Left operand
- `right: Expression [1]` - Right operand

**Concrete Subclasses:**
- `ArithmeticExpression` - Mathematical operations
- `ComparisonExpression` - Comparison operations

**Design Choice:** Factoring out common structure reduces duplication and makes the metamodel more maintainable.

---

#### 🔹 ArithmeticExpression

**Purpose:** Performs arithmetic operations.

**Attributes:**
- `operator: ArithmeticOperator` - PLUS, MINUS, MULTIPLY, DIVIDE, MODULO

**Inherits:**
- `left: Expression [1]`
- `right: Expression [1]`

**Design Choice:** Returns a numeric value, used for mathematical computations.

**Example:**
```java
ArithmeticExpression {
    operator = PLUS
    left = VariableReference { variableName = "count" }
    right = NumberLiteral { value = 1 }
}
```

**Corresponds to:** `count + 1`

**Complex example:**
```java
ArithmeticExpression {
    operator = MULTIPLY
    left = ArithmeticExpression {
        operator = PLUS
        left = NumberLiteral { value = 5 }
        right = NumberLiteral { value = 3 }
    }
    right = NumberLiteral { value = 2 }
}
```

**Corresponds to:** `(5 + 3) * 2`

---

#### 🔹 ComparisonExpression

**Purpose:** Compares two values.

**Attributes:**
- `operator: ComparisonOperator` - LESS, LESS_EQ, GREATER, GREATER_EQ, EQUALS, NOT_EQUALS

**Inherits:**
- `left: Expression [1]`
- `right: Expression [1]`

**Design Choice:** Returns a boolean value, used in conditions (loops, if-statements).

**Example:**
```java
ComparisonExpression {
    operator = LESS
    left = VariableReference { variableName = "count" }
    right = NumberLiteral { value = 5 }
}
```

**Corresponds to:** `count < 5`

**Example with sensor:**
```java
ComparisonExpression {
    operator = GREATER
    left = SensorRead { sensor = DISTANCE, unit = CM }
    right = NumberLiteral { value = 25 }
}
```

**Corresponds to:** `getDistance() in cm > 25`

---

#### 🔹 UnaryExpression

**Purpose:** Performs unary operations (operations with one operand).

**Attributes:**
- `operator: UnaryOperator` - MINUS (negation) or NOT (logical not)

**References:**
- `operand: Expression [1]` - The expression to operate on

**Design Choice:** Supports both arithmetic negation (`-x`) and logical negation (`!condition`).

**Example:**
```java
UnaryExpression {
    operator = MINUS
    operand = NumberLiteral { value = 5 }
}
```

**Corresponds to:** `-5`

```java
UnaryExpression {
    operator = NOT
    operand = ComparisonExpression {
        operator = EQUALS
        left = VariableReference { variableName = "done" }
        right = BooleanLiteral { value = true }
    }
}
```

**Corresponds to:** `!(done == true)` or `!done`

---

### 5. Enumerations

#### 🔹 ReturnType

**Purpose:** Specifies the return type of functions.

**Values:**
- `VOID` - Function returns no value
- `NUMBER` - Function returns a numeric value
- `BOOLEAN` - Function returns a boolean value

**Design Choice:** Strongly typed return types enable compile-time type checking.

**Example:**
```
let void square() { ... }      // ReturnType = VOID
let number getDistance() { ... } // ReturnType = NUMBER
let boolean isReady() { ... }   // ReturnType = BOOLEAN
```

---

#### 🔹 VariableType

**Purpose:** Specifies the type of variables and parameters.

**Values:**
- `NUMBER` - Numeric type (integers and decimals)
- `BOOLEAN` - Boolean type (true/false)

**Design Choice:** Simple type system with just two types, sufficient for robot control logic.

**Example:**
```
var number count = 0        // VariableType = NUMBER
var boolean ready = false   // VariableType = BOOLEAN
```

---

#### 🔹 Direction

**Purpose:** Movement directions for the robot.

**Values:**
- `FORWARD` - Move forward
- `BACKWARD` - Move backward
- `LEFT` - Move left (strafe)
- `RIGHT` - Move right (strafe)

**Design Choice:** Four-wheeled robot with omnidirectional capability supports all four cardinal directions.

**Example:**
```
Forward 30 in cm   // Direction = FORWARD
Backward 20 in cm  // Direction = BACKWARD
Left 15 in cm      // Direction = LEFT
Right 15 in cm     // Direction = RIGHT
```

---

#### 🔹 RotationDirection

**Purpose:** Rotation direction for the robot.

**Values:**
- `CLOCK` - Clockwise rotation
- `COUNTERCLOCK` - Counter-clockwise rotation

**Design Choice:** Clear, unambiguous direction names.

**Example:**
```
Clock 90          // RotationDirection = CLOCK
CounterClock 45   // RotationDirection = COUNTERCLOCK
```

---

#### 🔹 DistanceUnit

**Purpose:** Units for distance measurements.

**Values:**
- `CM` - Centimeters
- `MM` - Millimeters

**Design Choice:** Two common metric units suitable for small robot movements. Can be extended with meters, inches, etc.

**Example:**
```
30 in cm    // DistanceUnit = CM
300 in mm   // DistanceUnit = MM (equivalent to 30cm)
```

---

#### 🔹 SpeedUnit

**Purpose:** Units for speed measurements.

**Values:**
- `MM_PER_SEC` - Millimeters per second
- `CM_PER_SEC` - Centimeters per second

**Design Choice:** Speed is always "distance per second" - the enum specifies which distance unit.

**Example:**
```
setSpeed(150 in mm)  // SpeedUnit = MM_PER_SEC → 150mm/s
setSpeed(15 in cm)   // SpeedUnit = CM_PER_SEC → 15cm/s
```

---

#### 🔹 ArithmeticOperator

**Purpose:** Mathematical operators.

**Values:**
- `PLUS` - Addition (+)
- `MINUS` - Subtraction (-)
- `MULTIPLY` - Multiplication (*)
- `DIVIDE` - Division (/)
- `MODULO` - Modulo/remainder (%)

**Design Choice:** Standard arithmetic operators for numeric computations.

**Example:**
```
count + 1        // ArithmeticOperator = PLUS
distance - 10    // ArithmeticOperator = MINUS
speed * 2        // ArithmeticOperator = MULTIPLY
total / 3        // ArithmeticOperator = DIVIDE
x % 2            // ArithmeticOperator = MODULO
```

---

#### 🔹 ComparisonOperator

**Purpose:** Comparison operators for boolean expressions.

**Values:**
- `LESS` - Less than (<)
- `LESS_EQ` - Less than or equal (<=)
- `GREATER` - Greater than (>)
- `GREATER_EQ` - Greater than or equal (>=)
- `EQUALS` - Equal (==)
- `NOT_EQUALS` - Not equal (!=)

**Design Choice:** Complete set of comparison operators for conditional logic.

**Example:**
```
count < 5          // ComparisonOperator = LESS
distance <= 100    // ComparisonOperator = LESS_EQ
speed > 50         // ComparisonOperator = GREATER
time >= 1000       // ComparisonOperator = GREATER_EQ
x == y             // ComparisonOperator = EQUALS
ready != false     // ComparisonOperator = NOT_EQUALS
```

---

#### 🔹 UnaryOperator

**Purpose:** Unary operators.

**Values:**
- `MINUS` - Arithmetic negation (-)
- `NOT` - Logical negation (!)

**Design Choice:** Two essential unary operators for arithmetic and boolean logic.

**Example:**
```
-count       // UnaryOperator = MINUS (negation)
!ready       // UnaryOperator = NOT (logical not)
```

---

#### 🔹 SensorType

**Purpose:** Available robot sensors.

**Values:**
- `TIMESTAMP` - Time sensor (returns milliseconds)
- `DISTANCE` - Ultrasound distance sensor (returns distance to obstacle)

**Design Choice:** Currently supports two sensors. Can be extended with temperature, light, etc.

**Example:**
```
getTimestamp()         // SensorType = TIMESTAMP
getDistance() in cm    // SensorType = DISTANCE
```

---

## Key Design Decisions

### 1. **Abstract Classes for Extensibility**

**Decision:** Use `Statement`, `Expression`, `Command`, and `BinaryExpression` as abstract classes.

**Rationale:**
- **Type Safety:** Ensures only valid subclasses can be instantiated
- **Polymorphism:** Collections can hold heterogeneous elements (e.g., `Statement [0..*]`)
- **Extensibility:** Easy to add new statement types or expressions without modifying existing code
- **Code Reuse:** Common behavior is factored into abstract parents

**Example:** Function body can contain any mix of statements:
```
body: Statement [0..*]  // Can hold VariableDeclaration, Loop, Movement, etc.
```

---

### 2. **Separation of Statement and Expression**

**Decision:** Strict separation between statements (actions) and expressions (values).

**Rationale:**
- **Clear Semantics:** Statements perform actions; expressions compute values
- **Type Checking:** Expressions have types (number/boolean); statements don't
- **Error Prevention:** Cannot use a statement where an expression is expected
- **Follows Paradigm:** Matches imperative programming languages (C, Java, Python)

**Example:**
```java
// VALID: Expression used where Expression expected
condition: Expression = ComparisonExpression { ... }

// INVALID: Statement cannot be used as Expression
condition: Expression = Loop { ... }  // ❌ Type error
```

---

### 3. **Unit Handling with UnitExpression**

**Decision:** Create a separate `UnitExpression` class that wraps any expression.

**Rationale:**
- **Flexibility:** Units can be applied to literals, variables, or complex expressions
- **Composability:** `30 in cm`, `count in mm`, `(distance * 2) in cm` all work
- **Separation of Concerns:** Unit conversion is separate from value computation
- **Type Safety:** Units are enumeration values, preventing typos

---

### 4. **String-based References vs. Direct References**

**Decision:** Use `String` for variable/function names rather than EReference.

**Rationale:**
- **Simplicity:** Easier metamodel with fewer cross-references
- **Flexibility:** Can reference variables/functions defined later in the program

**Trade-off:**
- ✅ Simpler metamodel
- ✅ More flexible syntax
- ❌ Requires separate name resolution phase
- ❌ No compile-time reference validation

**Example:**
```java
Assignment {
    variable: String = "count"  // String reference
    value: Expression = ...
}

// vs. (not used)
Assignment {
    variable: EReference<VariableDeclaration>  // Direct reference
    value: Expression = ...
}
```

---

### 5. **Command Hierarchy Design**

**Decision:** Introduce intermediate `Command` abstract class between `Statement` and robot commands.

**Rationale:**
- **Semantic Grouping:** All robot actions are logically grouped
- **Extensibility:** Easy to add new robot commands (e.g., `Wait`, `Beep`, `SetLight`)
- **Reusability:** Can apply constraints/behaviors to all commands uniformly
- **Clear Intent:** Documents that these are robot-specific actions

**Alternative Considered:** Each command directly extends Statement
- ❌ Less organized
- ❌ Harder to identify robot-specific commands
- ❌ Cannot apply command-specific constraints

---

### 6. **Mandatory vs. Optional References**

**Decision:** Careful use of cardinalities `[0..1]`, `[1]`, `[0..*]`.

**Examples:**
- `Loop.condition [1]` - **Mandatory:** Every loop must have a condition
- `VariableDeclaration.initialValue [0..1]` - **Optional:** Variables can be uninitialized
- `Function.body [0..*]` - **Zero or more:** Empty function is valid (though useless)
- `BinaryExpression.left [1]` - **Mandatory:** Binary operation needs both operands

**Rationale:**
- **Expressiveness:** Model captures domain constraints naturally
- **Validation:** Invalid models are impossible to create
- **Documentation:** Cardinalities document requirements clearly

---

### 7. **Enumeration-based Type Safety**

**Decision:** Use enumerations for all fixed sets of values (operators, directions, units, types).

**Rationale:**
- **Type Safety:** Compiler prevents invalid values
- **Code Completion:** IDEs can suggest valid values
- **Documentation:** All valid values are explicitly listed
- **Refactoring Safety:** Renaming a literal updates all uses

**Alternative Considered:** String-based values
- ❌ Typos cause runtime errors
- ❌ No autocomplete
- ❌ Hard to find all uses

**Example:**
```java
// With enum (our choice)
Movement { direction = Direction.FORWARD }  // ✅ Type-safe

// With string (not used)
Movement { direction = "forward" }  // ❌ Typo: "forwrd" would be valid!
```

---

## 🧪 Complete Example: Square Pattern

Here's how the complete program from the lab assignment maps to the metamodel:

### Source Code:
```
let void entry () {
    setSpeed(150 in mm)
    var number count = 0
    loop count < 5 {	
        count = count + 1
        square()
    }
}

let void square(){
    Forward 30 in cm
    Clock 90
    Forward 300 in mm
    Clock 90
    Forward 30 in cm
    Clock 90
    Forward 300 in mm
    Clock 90
}
```

### Metamodel Instance (Abbreviated):
```java
Program {
    entry = Function {
        name = "entry"
        returnType = VOID
        body = [
            SetSpeed {
                unit = MM_PER_SEC
                speed = UnitExpression {
                    unit = MM
                    value = NumberLiteral { value = 150 }
                }
            },
            VariableDeclaration {
                name = "count"
                type = NUMBER
                initialValue = NumberLiteral { value = 0 }
            },
            Loop {
                condition = ComparisonExpression {
                    operator = LESS
                    left = VariableReference { variableName = "count" }
                    right = NumberLiteral { value = 5 }
                }
                body = [
                    Assignment {
                        variable = "count"
                        value = ArithmeticExpression {
                            operator = PLUS
                            left = VariableReference { variableName = "count" }
                            right = NumberLiteral { value = 1 }
                        }
                    },
                    FunctionCall { functionName = "square" }
                ]
            }
        ]
    }
    functions = [
        Function {
            name = "square"
            returnType = VOID
            body = [
                Movement {
                    direction = FORWARD
                    unit = CM
                    distance = UnitExpression {
                        unit = CM
                        value = NumberLiteral { value = 30 }
                    }
                },
                Rotation {
                    direction = CLOCK
                    angle = NumberLiteral { value = 90 }
                },
                Movement {
                    direction = FORWARD
                    unit = MM
                    distance = UnitExpression {
                        unit = MM
                        value = NumberLiteral { value = 300 }
                    }
                },
                Rotation {
                    direction = CLOCK
                    angle = NumberLiteral { value = 90 }
                },
                // ... (2 more iterations)
            ]
        }
    ]
}
```

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| **Total Classes** | 23 |
| Abstract Classes | 4 |
| Concrete Classes | 19 |
| **Enumerations** | 10 |
| **Total References** | 19 |
| Containment References | 19 |
| **Total Attributes** | 21 |

---

## ✅ Validation Checklist

- [x] All mandatory concepts included (movement, rotation, speed, sensors, units, arithmetic, boolean, loops, conditions, functions, variables)
- [x] Metamodel is validated without errors
- [x] Example program can be represented as instance
- [x] Abstract classes used appropriately
- [x] Cardinalities are correct
- [x] Enumerations for type safety
- [x] Clear separation of concerns (Statement vs Expression)
- [x] Extensible design for future enhancements
