// src/components/common/FileThumbnail.jsx
import React, { useMemo } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoCameraBack as VideoIcon,
  Description as DocIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ThumbnailContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: 120,
  height: 120,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const RemoveButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  width: 24,
  height: 24,
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

const FileThumbnail = React.memo(({ file, onRemove, showRemove = true }) => {
  const fileIcon = useMemo(() => {
    if (!file) return <DocIcon />;
    
    const type = file.type || '';
    const name = file.name || '';
    
    if (type.includes('pdf') || name.toLowerCase().endsWith('.pdf')) {
      return <PdfIcon color="error" />;
    }
    if (type.includes('image')) {
      return <ImageIcon color="primary" />;
    }
    if (type.includes('video')) {
      return <VideoIcon color="secondary" />;
    }
    return <DocIcon color="action" />;
  }, [file]);

  const fileSize = useMemo(() => {
    if (!file || !file.size) return '';
    const size = file.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }, [file]);

  const fileName = useMemo(() => {
    if (!file) return '';
    return file.name.length > 15 
      ? `${file.name.substring(0, 12)}...` 
      : file.name;
  }, [file]);

  const imagePreview = useMemo(() => {
    // Если есть previewUrl (для уже загруженных файлов)
    if (file?.previewUrl) {
      return (
        <Box
          component="img"
          src={file.previewUrl}
          alt={file.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 1,
          }}
        />
      );
    }
    
    // Если это новый файл (Blob/File) и это изображение
    if (file && file.type && file.type.includes('image')) {
      const imageUrl = URL.createObjectURL(file);
      return (
        <Box
          component="img"
          src={imageUrl}
          alt={file.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 1,
          }}
          onLoad={() => URL.revokeObjectURL(imageUrl)}
        />
      );
    }
    
    return null;
  }, [file]);

  const handleRemove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove?.();
  };

  return (
    <ThumbnailContainer variant="outlined">
      {showRemove && onRemove && (
        <RemoveButton size="small" onClick={handleRemove}>
          <DeleteIcon />
        </RemoveButton>
      )}
      
      {imagePreview ? (
        imagePreview
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'grey.100',
              color: 'text.secondary',
              mb: 1,
            }}
          >
            {fileIcon}
          </Avatar>
          <Typography variant="caption" display="block" noWrap>
            {fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fileSize}
          </Typography>
        </Box>
      )}
    </ThumbnailContainer>
  );
});

FileThumbnail.displayName = 'FileThumbnail';

export default FileThumbnail;