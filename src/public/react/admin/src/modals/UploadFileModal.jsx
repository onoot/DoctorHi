// src/components/modals/UploadFileModal.jsx
import React, { useState } from 'react';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import ActionButton from '../common/ActionButton';

const UploadFileModal = ({ isOpen, onClose, transactionId, category }) => {
  const { http } = useApi();
  const { showNotification } = useNotification();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');

  const getTitle = () => {
    if (category === 'agreement') return 'Upload Agreement';
    if (category === 'video') return 'Upload Video';
    return 'Upload File';
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f && f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return showNotification('error', 'Select a file');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      await http.post(`/v1/admin/transactions/${transactionId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showNotification('success', 'File uploaded successfully');
      onClose();
    } catch (err) {
      showNotification('error', 'Failed to upload file: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
                <h2>{getTitle()}</h2>
                <span className="modal-close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select File</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="form-control"
              />
              {preview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <ActionButton type="submit" variant="edit">
                Upload
              </ActionButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal;