import React, { useState } from 'react';
import {
  Paper,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Badge,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Popover,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  DateRange as DateIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Description as DocIcon
} from '@mui/icons-material';
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoCameraBack as VideoIcon,
  Description as DocIcon,
  InsertDriveFile as FileIcon,
  Description as DescriptionIcon,  
  Receipt as ReceiptIcon,        
  AttachFile as AttachFileIcon  
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

const CategoryChip = styled(Chip)(({ theme, active, categorycolor }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s',
  ...(active && {
    backgroundColor: theme.palette[categorycolor]?.light || theme.palette.primary.light,
    color: theme.palette[categorycolor]?.contrastText || theme.palette.primary.contrastText,
    borderColor: theme.palette[categorycolor]?.main || theme.palette.primary.main,
    '& .MuiChip-icon': {
      color: 'inherit',
    },
  }),
}));

const SearchField = styled(TextField)({
  flex: 1,
  minWidth: 200,
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
  },
});

const FileFilter = ({ 
  files = [], 
  onFilterChange,
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'date',
  onSortChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  const categories = [
    { value: 'agreement', label: 'Agreement', icon: <DocIcon />, color: 'primary' },
    { value: 'video', label: 'Video', icon: <VideoIcon />, color: 'secondary' },
    { value: 'proof_documents', label: 'Documents', icon: <DocIcon />, color: 'success' },
    { value: 'receipt', label: 'Receipt', icon: <FileIcon />, color: 'info' },
    { value: 'other', label: 'Other', icon: <FileIcon />, color: 'default' },
  ];

  const fileTypes = [
    { value: 'image', label: 'Images', icon: <ImageIcon />, count: files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.path)).length },
    { value: 'pdf', label: 'PDFs', icon: <PdfIcon />, count: files.filter(f => /\.pdf$/i.test(f.path)).length },
    { value: 'video', label: 'Videos', icon: <VideoIcon />, count: files.filter(f => /\.(mp4|avi|mov|mkv)$/i.test(f.path)).length },
    { value: 'document', label: 'Documents', icon: <DocIcon />, count: files.filter(f => /\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(f.path)).length },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date (newest first)', icon: <DateIcon /> },
    { value: 'date_asc', label: 'Date (oldest first)', icon: <DateIcon /> },
    { value: 'name', label: 'Name (A-Z)', icon: <SortIcon /> },
    { value: 'name_desc', label: 'Name (Z-A)', icon: <SortIcon /> },
    { value: 'size', label: 'Size (largest)', icon: <SortIcon /> },
    { value: 'size_asc', label: 'Size (smallest)', icon: <SortIcon /> },
  ];

  const handleCategoryToggle = (category) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newSelected);
    onFilterChange({ categories: newSelected, types: selectedTypes, search: searchTerm });
  };

  const handleTypeToggle = (type) => {
    const newSelected = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newSelected);
    onFilterChange({ categories: selectedCategories, types: newSelected, search: searchTerm });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ categories: selectedCategories, types: selectedTypes, search: value });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedTypes([]);
    onFilterChange({ categories: [], types: [], search: '' });
  };

  const activeFiltersCount = selectedCategories.length + selectedTypes.length + (searchTerm ? 1 : 0);

  return (
    <FilterPaper elevation={0}>
      <SearchField
        size="small"
        placeholder="Search files..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => handleSearchChange({ target: { value: '' } })}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title="Filter by category">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            color={selectedCategories.length ? 'primary' : 'default'}
          >
            <Badge badgeContent={selectedCategories.length} color="primary">
              <FilterIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Sort">
          <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
            <SortIcon />
          </IconButton>
        </Tooltip>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, val) => val && onViewModeChange(val)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridIcon />
          </ToggleButton>
          <ToggleButton value="list">
            <ListIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {activeFiltersCount > 0 && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            color="primary"
          >
            Clear ({activeFiltersCount})
          </Button>
        )}
      </Box>

      {/* Category Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { maxHeight: 300, width: 250 } }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Filter by Category
          </Typography>
        </MenuItem>
        {categories.map((cat) => (
          <MenuItem 
            key={cat.value}
            onClick={() => handleCategoryToggle(cat.value)}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {cat.icon}
              <Typography>{cat.label}</Typography>
            </Box>
            {selectedCategories.includes(cat.value) && (
              <Chip size="small" label="✓" color="primary" variant="outlined" />
            )}
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />
        
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Filter by Type
          </Typography>
        </MenuItem>
        {fileTypes.map((type) => (
          <MenuItem 
            key={type.value}
            onClick={() => handleTypeToggle(type.value)}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {type.icon}
              <Typography>{type.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({type.count})
              </Typography>
            </Box>
            {selectedTypes.includes(type.value) && (
              <Chip size="small" label="✓" color="primary" variant="outlined" />
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Sort by
          </Typography>
        </MenuItem>
        {sortOptions.map((opt) => (
          <MenuItem 
            key={opt.value}
            onClick={() => {
              onSortChange(opt.value);
              setSortAnchorEl(null);
            }}
            selected={sortBy === opt.value}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {opt.icon}
              <Typography>{opt.label}</Typography>
            </Box>
            {sortBy === opt.value && (
              <CheckIcon fontSize="small" sx={{ ml: 1 }} color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>
    </FilterPaper>
  );
};

export default FileFilter;