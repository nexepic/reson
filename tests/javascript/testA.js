class TestA {
    // Function to print "Hello, World!" and some lines with even/odd checks
    static printHelloTestA1() {
        console.log("Hello, World!"); // Print greeting
        for (let i = 0; i < 5; i++) {
            console.log("This is line " + i); // Print line number
            if (i % 2 === 0) {
                console.log("Even number"); // Even number check
            } else {
                console.log("Odd number"); // Odd number check
            }
        }
    }

    /*
     * Another function to print "Hello, World!" and some lines with even/odd checks
     * This function is similar to printHelloTestA1
     */
    static printHelloTestA2() {
        console.log("Hello, World!"); // Print greeting
        for (let i = 0; i < 5; i++) {
            console.log("This is line " + i); // Print line number
            if (i % 2 === 0) {
                console.log("Even number"); // Even number check
            } else {
                console.log("Odd number"); // Odd number check
            }
        }
    }

    // Main function to execute test functions
    static main() {
        this.printHelloTestA1(); // Call the first test function
        this.printHelloTestA2(); // Call the second test function
    }
}

// Execute main method
TestA.main(); // Start the tests