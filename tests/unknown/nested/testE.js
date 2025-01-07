class TestE {
    static printHelloTestE1() {
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

    static printHelloTestE2() {
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

    static printHelloTestE3() {
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
        this.printHelloTestE1();
        this.printHelloTestE2();
        this.printHelloTestE3();
    }
}

// Execute main method
TestE.main();