"""
This class contains methods to print "Hello, World!" and some lines with even/odd checks.
"""
class TestA:
    @staticmethod
    def print_hello_test_a1():
        """
        Prints "Hello, World!" and checks if the line number is even or odd.
        """
        print("Hello, World!")  # Print greeting
        for i in range(5):
            print(f"This is line {i}")  # Print line number
            if i % 2 == 0:
                print("Even number")  # Even number check
            else:
                print("Odd number")  # Odd number check

    @staticmethod
    def print_hello_test_a2():
        """
        Prints "Hello, World!" and checks if the line number is even or odd.
        This function is similar to print_hello_test_a1.
        """
        print("Hello, World!")  # Print greeting
        for i in range(5):
            print(f"This is line {i}")  # Print line number
            if i % 2 == 0:
                print("Even number")  # Even number check
            else:
                print("Odd number")  # Odd number check

    @staticmethod
    def main():
        """
        Main function to execute the test functions.
        """
        TestA.print_hello_test_a1()  # Call the first test function
        TestA.print_hello_test_a2()  # Call the second test function

# Execute main method
TestA.main()  # Start the tests