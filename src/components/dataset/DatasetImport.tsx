import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  LinearProgress,
} from '@mui/material';
import FileSelector from '../common/FileSelector';

interface ImportConfig {
  source: 'folder' | 'kohya' | 'textual_inversion';
  path: string;
  name: string;
  captionFormat: 'txt' | 'json' | 'jsonl' | 'none';
  tagSeparator: string;
}

interface DatasetImportProps {
  onComplete: () => void;
}

const DatasetImport: React.FC<DatasetImportProps> = ({ onComplete }) => {
  const [config, setConfig] = useState<ImportConfig>({
    source: 'folder',
    path: '',
    name: '',
    captionFormat: 'txt',
    tagSeparator: ',',
  });

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConfigChange = (field: keyof ImportConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Get list of images and their captions
      const files = await window.api.fs.readDir(config.path);
      const totalFiles = files.length;
      const dataset = {
        id: Date.now().toString(),
        name: config.name,
        path: config.path,
        images: [] as any[],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          source: config.source,
        },
      };

      // Process each file
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        if (file.endsWith('.jpg') || file.endsWith('.png') || 
            file.endsWith('.jpeg') || file.endsWith('.webp')) {
          let caption = '';
          let tags: string[] = [];

          // Load caption based on format
          if (config.captionFormat !== 'none') {
            const captionPath = `${file.slice(0, file.lastIndexOf('.'))}.${
              config.captionFormat === 'txt' ? 'txt' :
              config.captionFormat === 'json' ? 'json' : 'jsonl'
            }`;

            try {
              const content = await window.api.fs.readFile(captionPath);
              if (config.captionFormat === 'txt') {
                caption = content.toString().trim();
                // Extract tags if they exist (usually after a newline)
                const parts = caption.split('\n');
                if (parts.length > 1) {
                  caption = parts[0].trim();
                  tags = parts[1].replace('Tags:', '').trim()
                    .split(config.tagSeparator)
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                }
              } else if (config.captionFormat === 'json') {
                const json = JSON.parse(content);
                caption = json.caption || '';
                tags = json.tags || [];
              } else if (config.captionFormat === 'jsonl') {
                const json = JSON.parse(content);
                caption = json.text || '';
                tags = json.tags || [];
              }
            } catch (error) {
              console.warn(`Could not load caption for ${file}:`, error);
            }
          }

          dataset.images.push({
            id: `${dataset.id}_${i}`,
            filename: file,
            path: `${config.path}/${file}`,
            caption,
            tags,
          });
        }
        setProgress(((i + 1) / totalFiles) * 100);
      }

      // Save the dataset
      const datasets = await window.api.store.get('datasets') || [];
      await window.api.store.set('datasets', [...datasets, dataset]);
      
      onComplete();
    } catch (error) {
      console.error('Error importing dataset:', error);
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Import Dataset
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Source Type</InputLabel>
              <Select
                value={config.source}
                onChange={(e) =>
                  handleConfigChange('source', e.target.value)
                }
                label="Source Type"
              >
                <MenuItem value="folder">Image Folder</MenuItem>
                <MenuItem value="kohya">Kohya Dataset</MenuItem>
                <MenuItem value="textual_inversion">Textual Inversion</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FileSelector
              label="Dataset Path"
              value={config.path}
              onChange={(path) => handleConfigChange('path', path)}
              isDirectory
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dataset Name"
              value={config.name}
              onChange={(e) => handleConfigChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Caption Format</InputLabel>
              <Select
                value={config.captionFormat}
                onChange={(e) =>
                  handleConfigChange('captionFormat', e.target.value)
                }
                label="Caption Format"
              >
                <MenuItem value="none">No Captions</MenuItem>
                <MenuItem value="txt">Text Files (.txt)</MenuItem>
                <MenuItem value="json">JSON Files (.json)</MenuItem>
                <MenuItem value="jsonl">JSONL Files (.jsonl)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {config.captionFormat === 'txt' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tag Separator"
                value={config.tagSeparator}
                onChange={(e) => handleConfigChange('tagSeparator', e.target.value)}
                helperText="Character used to separate tags in text files"
              />
            </Grid>
          )}

          {isImporting && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" align="center">
                  Importing... {Math.round(progress)}%
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={isImporting || !config.path || !config.name}
              fullWidth
            >
              Import Dataset
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DatasetImport;
