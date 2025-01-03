class TestC:
    @staticmethod
    def print_hello_test_c1():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")
        print("End of printHello")

    @staticmethod
    def print_hello_test_c2():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")
            print(f"Current iteration: {i}")
        print("End of printHelloAgain")

    @staticmethod
    def main():
        TestC.print_hello_test_c1()
        TestC.print_hello_test_c2()

# Execute main method
TestC.main()