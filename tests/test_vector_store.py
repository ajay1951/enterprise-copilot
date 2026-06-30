import unittest
from unittest.mock import MagicMock, patch, mock_open
import app.vector_store as vector_store
import os


class VectorStoreTests(unittest.TestCase):
    def test_recreates_collection_when_embedding_dimension_changes(self):
        with patch.object(vector_store, "client") as mock_client, patch.object(vector_store, "embeddings_client") as mock_embeddings:
            mock_collection_info = MagicMock()
            mock_collection_info.config.params.vectors.size = 4096
            mock_client.get_collection.return_value = mock_collection_info
            mock_embeddings.embed_query.return_value = [0.1] * 1536
            mock_embeddings.embed_documents.return_value = [[0.1] * 1536 for _ in range(3)]

            with patch.object(vector_store, "get_embedding_vector_size", return_value=1536):
                vector_store.init_collection()

            mock_client.delete_collection.assert_called_once_with(collection_name=vector_store.COLLECTION_NAME)
            mock_client.create_collection.assert_called_once()
            vectors_config = mock_client.create_collection.call_args.kwargs["vectors_config"]
            self.assertEqual(vectors_config.size, 1536)

    @patch("app.vector_store.os.listdir")
    @patch("app.vector_store.Path.is_dir")
    @patch.object(vector_store, "client")
    @patch.object(vector_store, "embeddings_client")
    def test_loads_documents_from_markdown_files(self, mock_embeddings, mock_client, mock_is_dir, mock_listdir):
        # Arrange
        # Make init_collection think the collection does not exist
        mock_client.get_collection.side_effect = vector_store.UnexpectedResponse(MagicMock())
        mock_is_dir.return_value = True
        mock_listdir.return_value = ["test_doc.md"]
        
        mock_md_content = "# Test Title\nThis is test content."
        
        # Mock file reading
        m_open = mock_open(read_data=mock_md_content)
        
        # Mock embedding
        mock_embeddings.embed_documents.return_value = [[0.1] * 1536]
        
        with patch("builtins.open", m_open), \
             patch.object(vector_store, "get_embedding_vector_size", return_value=1536):
            # Act
            vector_store.init_collection()

        # Assert
        mock_client.upsert.assert_called_once()
        
        upsert_kwargs = mock_client.upsert.call_args.kwargs
        points = upsert_kwargs.get("points", [])
        self.assertEqual(len(points), 1)
        
        self.assertEqual(points[0].payload["title"], "Test Title")
        self.assertEqual(points[0].payload["content"], mock_md_content)
        self.assertEqual(points[0].payload["metadata"]["source"], "test_doc.md")

if __name__ == "__main__":
    unittest.main()
