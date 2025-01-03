class TestA {
    static printHelloTestA1() {
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

    static printHelloTestA2() {
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
        this.printHelloTestA1();
        this.printHelloTestA2();
    }
}

// Execute main method
TestA.main();