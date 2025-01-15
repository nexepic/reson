public class TestA {
    // This method prints "Hello, World!" and then prints lines with even/odd checks
    public static void printHelloTestA1() {
        System.out.println("Hello, World!"); // Print greeting
        for (int i = 0; i < 5; i++) { // Loop from 0 to 4
            System.out.println("This is line " + i); // Print line number
            if (i % 2 == 0) { // Check if the number is even
                System.out.println("Even number"); // Print if even
            } else {
                System.out.println("Odd number"); // Print if odd
            }
        }
    }

    // This method is similar to printHelloTestA1
    public static void printHelloTestA2() {
        System.out.println("Hello, World!"); // Print greeting
        for (int i = 0; i < 5; i++) { // Loop from 0 to 4
            System.out.println("This is line " + i); // Print line number
            if (i % 2 == 0) { // Check if the number is even
                System.out.println("Even number"); // Print if even
            } else {
                System.out.println("Odd number"); // Print if odd
            }
        }
    }

    /*
     * Main method to execute the test methods
     */
    public static void main(String[] args) {
        printHello(); // Call to a method not defined in this snippet
        printHelloTestA1(); // Call the first test method
        printHelloTestA2(); // Call the second test method
    }
}