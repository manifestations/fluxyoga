import React from 'react';
import { Button, TextField, Box, Tooltip } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface FileSelectorProps {
  value: string;
  onChange: (path: string) => void;
  label: string;
  filter?: string;
  helperText?: string;
  required?: boolean;
  isDirectory?: boolean;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  value,
  onChange,
  label,
  filter,
  helperText,
  required = false,
  isDirectory = false,
}) => {
  const handleBrowse = async () => {
    try {
      const result = await window.api.showOpenDialog({
        properties: isDirectory ? ['openDirectory'] : ['openFile'],
        filters: !isDirectory && filter
          ? [
              {
                name: 'Model Files',
                extensions: filter.split(',').map((f) => f.replace('.', '')),
              },
            ]
          : undefined,
      });

      if (!result.canceled && result.filePaths.length > 0) {
        onChange(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        helperText={helperText}
        sx={{ flexGrow: 1 }}
      />
      <Tooltip title={`Browse for ${label}`}>
        <Button
          variant="contained"
          onClick={handleBrowse}
          startIcon={<FolderOpenIcon />}
          sx={{ minWidth: '120px' }}
        >
          Browse
        </Button>
      </Tooltip>
    </Box>
  );
};

export default FileSelector;
