import unittest
from unittest.mock import patch
from app.tools import create_ticket

class ToolsTests(unittest.TestCase):
    @patch("app.tools.secrets.randbelow")
    def test_create_ticket(self, mock_randbelow):
        # Arrange
        mock_randbelow.return_value = 1234
        summary = "My laptop is not turning on"
        priority = "high"

        # Act
        result = create_ticket.invoke({"summary": summary, "priority": priority})

        # Assert
        self.assertIn("Successfully created ticket TICKET-2234", result) # 1000 + 1234
        self.assertIn("priority 'high'", result)
        self.assertIn("summary of your issue is: 'My laptop is not turning on'", result)
        mock_randbelow.assert_called_once_with(8999)

if __name__ == "__main__":
    unittest.main()