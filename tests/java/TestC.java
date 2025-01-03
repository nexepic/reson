public class TestC {
    public static void printHelloTestC1() {
        System.out.println("Hello, World!");
        for (int i = 0; i < 5; i++) {
            System.out.println("This is line " + i);
            if (i % 2 == 0) {
                System.out.println("Even number");
            } else {
                System.out.println("Odd number");
            }
        }
        System.out.println("End of printHello");
    }

    public static void printHelloTestC2() {
        System.out.println("Hello, World!");
        for (int i = 0; i < 5; i++) {
            System.out.println("This is line " + i);
            if (i % 2 == 0) {
                System.out.println("Even number");
            } else {
                System.out.println("Odd number");
            }
            System.out.println("Current iteration: " + i);
        }
        System.out.println("End of printHelloAgain");
    }

    public static void main(String[] args) {
        printHello();
        printHelloTestC1();
        printHelloTestC2();
    }
}