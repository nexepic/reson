class TestC {
    static printHelloTestC1(): void {
        console.log("Hello, World!");
        for (let i: number = 0; i < 5; i++) {
            console.log(`This is line ${i}`);
            if (i % 2 === 0) {
                console.log("Even number");
            } else {
                console.log("Odd number");
            }
        }
        console.log("End of printHello");
    }

    static printHelloTestC2(): void {
        console.log("Hello, World!");
        for (let i: number = 0; i < 5; i++) {
            console.log(`This is line ${i}`);
            if (i % 2 === 0) {
                console.log("Even number");
            } else {
                console.log("Odd number");
            }
            console.log(`Current iteration: ${i}`);
        }
        console.log("End of printHelloAgain");
    }

    static main(): void {
        this.printHelloTestC1();
        this.printHelloTestC2();
    }
}

// Execute main method
TestC.main();