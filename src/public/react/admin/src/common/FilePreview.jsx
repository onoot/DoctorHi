// src/components/common/FilePreview.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  LinearProgress,
  Button
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoCameraBack as VideoIcon,
  Description as DocIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InsertDriveFile as FileIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,  
  Receipt as ReceiptIcon,        
  AttachFile as AttachFileIcon  
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import filesAPI from '../api/filesAPI';

const FileCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    '& .file-actions': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
}));

const ThumbnailContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 160,
  position: 'relative',
  backgroundColor: theme.palette.grey[100],
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ThumbnailImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

const FileIconLarge = styled(Box)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const CategoryChip = styled(Chip)(({ theme, categorycolor }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  fontWeight: 500,
  backdropFilter: 'blur(4px)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxShadow: theme.shadows[2],
  ...(categorycolor === 'primary' && {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  }),
  ...(categorycolor === 'secondary' && {
    borderLeft: `3px solid ${theme.palette.secondary.main}`,
  }),
  ...(categorycolor === 'success' && {
    borderLeft: `3px solid ${theme.palette.success.main}`,
  }),
  ...(categorycolor === 'info' && {
    borderLeft: `3px solid ${theme.palette.info.main}`,
  }),
}));

const FileActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  display: 'flex',
  gap: 4,
  opacity: 0,
  transform: 'translateY(10px)',
  transition: 'all 0.2s ease-in-out',
  zIndex: 2,
}));

const FileInfo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
}));

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const getFileIcon = (fileName, size = 'medium') => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  const iconSize = size === 'large' ? 64 : 40;
  
  const iconMap = {
    pdf: <PdfIcon sx={{ fontSize: iconSize, color: '#f44336' }} />,
    jpg: <ImageIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    jpeg: <ImageIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    png: <ImageIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    gif: <ImageIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    webp: <ImageIcon sx={{ fontSize: iconSize, color: '#9c27b0' }} />,
    bmp: <ImageIcon sx={{ fontSize: iconSize, color: '#607d8b' }} />,
    svg: <ImageIcon sx={{ fontSize: iconSize, color: '#ff5722' }} />,
    mp4: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    avi: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    mov: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    mkv: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    wmv: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    doc: <DocIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    docx: <DocIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    xls: <DocIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    xlsx: <DocIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    ppt: <DocIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    pptx: <DocIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    txt: <DocIcon sx={{ fontSize: iconSize, color: '#9e9e9e' }} />,
  };
  
  return iconMap[ext] || <FileIcon sx={{ fontSize: iconSize, color: '#757575' }} />;
};

const getFileCategoryColor = (category) => {
  const colors = {
    agreement: 'primary',
    video: 'secondary',
    proof_documents: 'success',
    receipt: 'info',
    other: 'default',
  };
  return colors[category] || 'default';
};

const getFileCategoryLabel = (category) => {
  const labels = {
    agreement: 'Agreement',
    video: 'Video',
    proof_documents: 'Documents',
    receipt: 'Receipt',
    other: 'Other',
  };
  return labels[category] || category;
};

const FilePreview = ({ file, onDelete, onUpload }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fileCategory = getFileCategoryLabel(file.category);
  const categoryColor = getFileCategoryColor(file.category);
  const fileUrl = filesAPI.getFileUrl(file.path);
  const thumbnailUrl = filesAPI.getThumbnailUrl(file.path);
  const isImage = thumbnailUrl !== null && !imageError;
  const fileName = file.name || file.filename || 'Unknown file';
  const fileSize = formatFileSize(file.size);
  const uploadedDate = formatDate(file.created_at);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FileCard variant="outlined">
      <Box sx={{ position: 'relative' }}>
        <CategoryChip
          label={fileCategory}
          size="small"
          categorycolor={categoryColor}
          icon={
            file.category === 'agreement' ? <DescriptionIcon /> :
            file.category === 'video' ? <VideoIcon /> :
            file.category === 'proof_documents' ? <DescriptionIcon /> :
            file.category === 'receipt' ? <ReceiptIcon /> :
            <FileIcon />
          }
        />
        
        <ThumbnailContainer>
          {isImage ? (
            <ThumbnailImage
              src={thumbnailUrl}
              alt={fileName}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <FileIconLarge>
              {getFileIcon(fileName, 'large')}
            </FileIconLarge>
          )}
          
          <FileActions className="file-actions">
            <Tooltip title="View">
              <IconButton
                size="small"
                href={fileUrl}
                target="_blank"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={loading}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </FileActions>
        </ThumbnailContainer>
      </Box>

      <FileInfo>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              fontWeight={500}
              noWrap
              title={fileName}
              sx={{ mb: 0.5 }}
            >
              {fileName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {fileSize}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {uploadedDate}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton 
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ ml: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 1.5 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Type:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {file.type || 'Unknown'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Size:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {fileSize}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Uploaded:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {new Date(file.created_at).toLocaleString()}
              </Typography>
            </Box>
            
            {file.category === 'receipt' && (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => onUpload?.('receipt')}
                >
                  Upload New Receipt
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </FileInfo>

      {loading && (
        <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      )}
    </FileCard>
  );
};

export default FilePreview;