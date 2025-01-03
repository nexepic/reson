class TestB {
    static printHelloTestB1() {
        console.log("Hello, World!");
        for (let i = 0; i < 5; i++) {
            console.log("This is line " + i);
            if (i % 2 === 0) {
                console.log("Even number");
            } else {
                console.log("Odd number");
            }
        }
    }

    static printHelloTestB2() {
        console.log("Hello, World!");
        for (let i = 0; i < 5; i++) {
            console.log("This is line " + i);
            if (i % 2 === 0) {
                console.log("Even number");
            } else {
                console.log("Odd number");
            }
        }
        console.log("End of printHello");
    }

    static printHelloTestB3() {
        console.log("Hello, World!");
        for (let i = 0; i < 5; i++) {
            console.log("This is line " + i);
            if (i % 2 === 0) {
                console.log("Even number");
            } else {
                console.log("Odd number");
            }
        }
    }

    static main() {
        this.printHelloTestB1();
        this.printHelloTestB2();
        this.printHelloTestB3();
    }
}

// Execute main method
TestB.main();