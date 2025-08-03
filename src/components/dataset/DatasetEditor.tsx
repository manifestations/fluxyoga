import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { datasetService } from '../../services/datasets/datasetService';
import { ImageDataset, ImageItem, BatchOperation } from '../../services/datasets/types';

interface DatasetEditorProps {
  datasetId: string;
}

const DatasetEditor: React.FC<DatasetEditorProps> = ({ datasetId }) => {
  const [dataset, setDataset] = useState<ImageDataset | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [tempCaption, setTempCaption] = useState('');
  const [newTag, setNewTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchOperation, setBatchOperation] = useState<BatchOperation>({
    type: 'replace',
    target: 'caption',
    search: '',
    replace: '',
  });

  useEffect(() => {
    loadDataset();
  }, [datasetId]);

  const loadDataset = async () => {
    try {
      const storedDatasets = await window.api.store.get('datasets') || [];
      const dataset = storedDatasets.find((ds: ImageDataset) => ds.id === datasetId);
      if (dataset) {
        setDataset(dataset);
        // Collect all unique tags
        const tags = new Set<string>();
        dataset.images.forEach((img: any) => {
          img.tags.forEach((tag: string) => tags.add(tag));
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
    }
  };

  const handleImageSelect = (image: ImageItem) => {
    setSelectedImage(image);
    setTempCaption(image.caption);
    setEditingCaption(false);
  };

  const handleSaveCaption = async () => {
    if (!dataset || !selectedImage) return;

    try {
      const updatedImages = dataset.images.map((img) =>
        img.id === selectedImage.id ? { ...img, caption: tempCaption } : img
      );

      const updatedDataset = { ...dataset, images: updatedImages };
      await window.api.store.set('datasets', [
        ...(await window.api.store.get('datasets')).filter((ds: ImageDataset) => ds.id !== datasetId),
        updatedDataset,
      ]);

      setDataset(updatedDataset);
      setEditingCaption(false);
    } catch (error) {
      console.error('Error saving caption:', error);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!dataset || !selectedImage || !tag || selectedImage.tags.includes(tag)) return;

    try {
      const updatedImages = dataset.images.map((img) =>
        img.id === selectedImage.id ? { ...img, tags: [...img.tags, tag] } : img
      );

      const updatedDataset = { ...dataset, images: updatedImages };
      await window.api.store.set('datasets', [
        ...(await window.api.store.get('datasets')).filter((ds: ImageDataset) => ds.id !== datasetId),
        updatedDataset,
      ]);

      setDataset(updatedDataset);
      setNewTag('');
      if (!allTags.includes(tag)) {
        setAllTags([...allTags, tag]);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!dataset || !selectedImage) return;

    try {
      const updatedImages = dataset.images.map((img) =>
        img.id === selectedImage.id
          ? { ...img, tags: img.tags.filter((tag) => tag !== tagToRemove) }
          : img
      );

      const updatedDataset = { ...dataset, images: updatedImages };
      await window.api.store.set('datasets', [
        ...(await window.api.store.get('datasets')).filter((ds: ImageDataset) => ds.id !== datasetId),
        updatedDataset,
      ]);

      setDataset(updatedDataset);
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleBatchOperation = async () => {
    if (!dataset) return;

    try {
      await datasetService.batchEdit(datasetId, batchOperation);
      await loadDataset();
      setBatchDialog(false);
    } catch (error) {
      console.error('Error performing batch operation:', error);
    }
  };

  const filteredImages = dataset?.images.filter((img) => {
    if (!filter) return true;
    return (
      img.caption.toLowerCase().includes(filter.toLowerCase()) ||
      img.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Left panel - Image list */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                label="Filter images"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ mr: 2 }}
              />
              <Button
                startIcon={<FilterIcon />}
                variant="outlined"
                onClick={() => setBatchDialog(true)}
              >
                Batch Operations
              </Button>
            </Box>

            <ImageList cols={3} gap={8}>
              {filteredImages ? filteredImages.map((image) => (
                <ImageListItem
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  sx={{
                    cursor: 'pointer',
                    border: selectedImage?.id === image.id ? '2px solid primary.main' : 'none',
                  }}
                >
                  <img
                    src={`file://${image.path}`}
                    alt={image.caption}
                    loading="lazy"
                    style={{ height: '150px', objectFit: 'cover' }}
                  />
                  <ImageListItemBar
                    title={image.caption.slice(0, 50) + (image.caption.length > 50 ? '...' : '')}
                    subtitle={image.tags.join(', ')}
                  />
                </ImageListItem>
              )) : []}
            </ImageList>
          </Paper>
        </Grid>

        {/* Right panel - Image editor */}
        <Grid item xs={12} md={4}>
          {selectedImage ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <img
                  src={`file://${selectedImage.path}`}
                  alt={selectedImage.caption}
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Caption
                  <IconButton size="small" onClick={() => setEditingCaption(!editingCaption)}>
                    {editingCaption ? <SaveIcon /> : <EditIcon />}
                  </IconButton>
                </Typography>
                {editingCaption ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={tempCaption}
                    onChange={(e) => setTempCaption(e.target.value)}
                    onBlur={handleSaveCaption}
                  />
                ) : (
                  <Typography variant="body1">{selectedImage.caption}</Typography>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {selectedImage.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
                <Autocomplete
                  freeSolo
                  options={allTags}
                  value={newTag}
                  onChange={(_, value) => value && handleAddTag(value)}
                  onInputChange={(_, value) => setNewTag(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Add tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag(newTag);
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                Resolution: {selectedImage.metadata.width} x {selectedImage.metadata.height}
                <br />
                Format: {selectedImage.metadata.format}
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1" color="text.secondary" align="center">
                Select an image to edit
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Batch Operations Dialog */}
      <Dialog open={batchDialog} onClose={() => setBatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Batch Operations</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Operation Type"
                value={batchOperation.type}
                onChange={(e) =>
                  setBatchOperation({ ...batchOperation, type: e.target.value as any })
                }
                SelectProps={{ native: true }}
              >
                <option value="replace">Replace Text</option>
                <option value="append">Append Text</option>
                <option value="prepend">Prepend Text</option>
                <option value="remove">Remove Tag</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Target"
                value={batchOperation.target}
                onChange={(e) =>
                  setBatchOperation({ ...batchOperation, target: e.target.value as any })
                }
                SelectProps={{ native: true }}
              >
                <option value="caption">Captions</option>
                <option value="tags">Tags</option>
              </TextField>
            </Grid>

            {batchOperation.type === 'replace' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Search for"
                    value={batchOperation.search}
                    onChange={(e) =>
                      setBatchOperation({ ...batchOperation, search: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Replace with"
                    value={batchOperation.replace}
                    onChange={(e) =>
                      setBatchOperation({ ...batchOperation, replace: e.target.value })
                    }
                  />
                </Grid>
              </>
            )}

            {(batchOperation.type === 'append' || batchOperation.type === 'prepend') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Text to Add"
                  value={batchOperation.value}
                  onChange={(e) =>
                    setBatchOperation({ ...batchOperation, value: e.target.value })
                  }
                />
              </Grid>
            )}

            {batchOperation.type === 'remove' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tag to Remove"
                  value={batchOperation.value}
                  onChange={(e) =>
                    setBatchOperation({ ...batchOperation, value: e.target.value })
                  }
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialog(false)}>Cancel</Button>
          <Button onClick={handleBatchOperation} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatasetEditor;
