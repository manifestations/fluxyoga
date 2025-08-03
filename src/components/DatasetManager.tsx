import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  Chip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  TextFields as CaptionIcon,
  Transform as ProcessIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import FileSelector from './common/FileSelector';

// TypeScript interfaces for API calls
interface PreprocessConfig {
  inputDir: string;
  outputDir: string;
  resizeMode: 'keep_ratio' | 'fill' | 'crop';
  targetWidth: number;
  targetHeight: number;
  autoContrast?: boolean;
  normalize?: boolean;
  sharpen?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ImageWithCaption {
  filename: string;
  path: string;
  caption: string;
  isModified: boolean;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      id={`dataset-tabpanel-${index}`}
      aria-labelledby={`dataset-tab-${index}`}
      {...other}
      style={{ display: value === index ? 'block' : 'none' }}
    >
      <Box sx={{ pt: 3 }}>{children}</Box>
    </div>
  );
}

const DatasetManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [datasetPath, setDatasetPath] = useState('');
  const [datasets, setDatasets] = useState<string[]>([]);
  const [bucketResolution, setBucketResolution] = useState(512);
  const [bucketSizeLimit, setBucketSizeLimit] = useState(1024);
  
  // Image preprocessing state
  const [sourceFolder, setSourceFolder] = useState('');
  const [outputFolder, setOutputFolder] = useState('');
  const [targetSize, setTargetSize] = useState(512);
  const [resizeMode, setResizeMode] = useState<'keep_ratio' | 'fill' | 'crop'>('crop');
  const [jpegQuality, setJpegQuality] = useState(95);
  const [convertFormat, setConvertFormat] = useState('jpg');
  const [processing, setProcessing] = useState(false);
  
  // Caption generation state
  const [captionSourceFolder, setCaptionSourceFolder] = useState('');
  const [captionModel, setCaptionModel] = useState<'gpt-4-vision' | 'blip' | 'blip2' | 'vit-gpt2' | 'florence-2'>('florence-2');
  const [captionTemplate, setCaptionTemplate] = useState('');
  const [overwriteCaptions, setOverwriteCaptions] = useState(false);
  const [captionGenerating, setCaptionGenerating] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);
  const [captionProgress, setCaptionProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [totalFiles, setTotalFiles] = useState(0);
  
  // Image grid state for caption editing
  const [loadedImages, setLoadedImages] = useState<ImageWithCaption[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Dataset configuration for LoRA training
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [triggerWord, setTriggerWord] = useState('');

  // Listen for Python progress updates
  useEffect(() => {
    const handleProgress = (data: any) => {
      if (typeof data === 'string') {
        // Handle plain text messages
        if (data.includes('Processing:')) {
          const filename = data.replace('Processing:', '').trim();
          setCurrentFile(filename);
        } else if (data.includes('Processed')) {
          const match = data.match(/Processed (\d+)\/(\d+)/);
          if (match) {
            setCaptionProgress(parseInt(match[1]));
            setTotalFiles(parseInt(match[2]));
          }
        }
      } else if (data && typeof data === 'object') {
        // Handle structured data objects
        if (data.type === 'file_processed') {
          setProcessedFiles(prev => [...prev, data.filename]);
          setCurrentFile(data.filename);
          
          // Update the image grid with the new caption
          if (data.caption && data.filename) {
            setLoadedImages(prev => prev.map(img => 
              img.filename === data.filename 
                ? { ...img, caption: data.caption, isModified: false }
                : img
            ));
          }
        } else if (data.type === 'progress') {
          if (data.filename) {
            setCurrentFile(data.filename);
          }
          if (data.current && data.total) {
            setCaptionProgress(data.current);
            setTotalFiles(data.total);
          }
        }
      }
    };

    // Set up the listener
    if (window.api?.onProgress) {
      const unsubscribe = window.api.onProgress(handleProgress);
      return unsubscribe;
    }
  }, []);

  // Load images when caption source folder changes
  useEffect(() => {
    const loadImagesFromFolder = async () => {
      if (!captionSourceFolder) {
        setLoadedImages([]);
        return;
      }

      setLoadingImages(true);
      try {
        // Get list of image files from folder
        const files = await window.api.fs.readDir(captionSourceFolder);
        const imageFiles = files.filter((filename: string) => 
          /\.(jpg|jpeg|png|bmp|webp|tiff)$/i.test(filename)
        );

        const imagesWithCaptions: ImageWithCaption[] = await Promise.all(
          imageFiles.map(async (filename: string) => {
            const imagePath = `${captionSourceFolder}/${filename}`;
            const captionPath = imagePath.replace(/\.[^/.]+$/, '.txt');
            
            // Try to load existing caption
            let caption = '';
            try {
              const existingCaption = await window.api.fs.readFile(captionPath);
              caption = existingCaption || '';
            } catch {
              // No existing caption file
              caption = '';
            }

            return {
              filename,
              path: imagePath,
              caption,
              isModified: false
            };
          })
        );

        setLoadedImages(imagesWithCaptions);
      } catch (error) {
        console.error('Error loading images:', error);
        setLoadedImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    loadImagesFromFolder();
  }, [captionSourceFolder]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddDataset = () => {
    if (datasetPath && !datasets.includes(datasetPath)) {
      setDatasets([...datasets, datasetPath]);
      setDatasetPath('');
    }
  };

  const handleRemoveDataset = (index: number) => {
    const newDatasets = [...datasets];
    newDatasets.splice(index, 1);
    setDatasets(newDatasets);
  };

  const handlePreprocessImages = async () => {
    if (!sourceFolder || !outputFolder) {
      alert('Please select both source and output folders');
      return;
    }

    setProcessing(true);
    setProcessedFiles([]);
    
    try {
      const config: PreprocessConfig = {
        inputDir: sourceFolder,
        outputDir: outputFolder,
        targetWidth: targetSize,
        targetHeight: targetSize,
        resizeMode: resizeMode,
        autoContrast: true,
        normalize: false,
        sharpen: false,
      };

      // Call Python preprocessing script
      await window.api.python.preprocess(config);
      
      // Automatically set the caption source folder to the output folder
      setCaptionSourceFolder(outputFolder);
      
      alert('Image preprocessing completed successfully! Caption source folder has been automatically set to the output folder.');
      
      // Switch to the caption generation tab for the next step
      setTabValue(2);
    } catch (error) {
      console.error('Error preprocessing images:', error);
      alert('Error during image preprocessing');
    } finally {
      setProcessing(false);
    }
  };

  // Caption editing functions
  const handleCaptionChange = (index: number, newCaption: string) => {
    console.log(`Caption changed for index ${index}:`, newCaption);
    console.log('Current image at index:', loadedImages[index]);
    
    setLoadedImages(prev => {
      const updated = prev.map((img, i) => {
        if (i === index) {
          const updatedImg = { ...img, caption: newCaption, isModified: true };
          console.log('Updated image:', updatedImg);
          return updatedImg;
        }
        return img;
      });
      
      const modifiedCount = updated.filter(img => img.isModified).length;
      console.log('Total modified images after update:', modifiedCount);
      console.log('All images:', updated.map(img => ({ filename: img.filename, isModified: img.isModified, caption: img.caption.substring(0, 50) + '...' })));
      
      return updated;
    });
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = loadedImages[index];
    if (!imageToDelete) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${imageToDelete.filename}"? This will permanently delete both the image and its caption file.`
    );

    if (!confirmDelete) return;

    try {
      // Delete the image file
      await (window.api.fs as any).deleteFile(imageToDelete.path);
      
      // Delete the caption file if it exists
      const captionPath = imageToDelete.path.replace(/\.[^/.]+$/, '.txt');
      try {
        await (window.api.fs as any).deleteFile(captionPath);
      } catch {
        // Caption file might not exist, that's okay
      }

      // Remove from the loaded images
      setLoadedImages(prev => prev.filter((_, i) => i !== index));
      
      alert(`Successfully deleted "${imageToDelete.filename}"`);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Error deleting "${imageToDelete.filename}": ${error}`);
    }
  };

  const handleUpdateCaptions = async () => {
    try {
      const modifiedImages = loadedImages.filter(img => img.isModified);
      if (modifiedImages.length === 0) {
        alert('No captions have been modified.');
        return;
      }

      // Save all modified captions
      await Promise.all(
        modifiedImages.map(async (img) => {
          const captionPath = img.path.replace(/\.[^/.]+$/, '.txt');
          await window.api.fs.writeFile(captionPath, img.caption);
        })
      );

      // Mark all as unmodified
      setLoadedImages(prev => prev.map(img => ({ ...img, isModified: false })));
      
      alert(`Updated ${modifiedImages.length} caption files successfully!`);
    } catch (error) {
      console.error('Error updating captions:', error);
      alert('Error updating caption files');
    }
  };

  const handleGenerateDatasetToml = async () => {
    if (!captionSourceFolder) {
      alert('Please select a source folder first');
      return;
    }

    if (!datasetName.trim()) {
      alert('Please enter a dataset name');
      return;
    }

    try {
      const tomlContent = generateDatasetTomlContent();
      const tomlPath = `${captionSourceFolder}/dataset.toml`;
      
      await window.api.fs.writeFile(tomlPath, tomlContent);
      
      alert(`Dataset.toml generated successfully at: ${tomlPath}`);
    } catch (error) {
      console.error('Error generating dataset.toml:', error);
      alert('Error generating dataset.toml file');
    }
  };

  const generateDatasetTomlContent = (): string => {
    const totalImages = loadedImages.length;
    const captionedImages = loadedImages.filter(img => img.caption.trim()).length;
    
    return `# Dataset configuration for LoRA training
# Generated by FluxYoga on ${new Date().toISOString()}

[dataset]
name = "${datasetName}"
description = "${datasetDescription || `A dataset containing ${totalImages} images for LoRA training`}"
total_images = ${totalImages}
captioned_images = ${captionedImages}
trigger_word = "${triggerWord}"
data_dir = "${captionSourceFolder.replace(/\\/g, '/')}"

[training_config]
# Basic training parameters
max_train_epochs = 20
train_batch_size = 1
learning_rate = 1e-4
lr_scheduler = "cosine"
lr_warmup_steps = 0

# Model parameters
network_dim = 32
network_alpha = 16
output_name = "${datasetName.toLowerCase().replace(/\s+/g, '_')}"

# Advanced settings
mixed_precision = "fp16"
save_precision = "fp16"
cache_latents = true
cache_latents_to_disk = true
flip_aug = true
color_aug = false
face_crop_aug_range = "1.0,3.0"

# Caption settings
caption_extension = ".txt"
shuffle_caption = true
keep_tokens = 1
min_snr_gamma = 5

# Output settings
save_every_n_epochs = 5
save_model_as = "safetensors"
`;
  };

  const handleGenerateCaptions = async () => {
    if (!captionSourceFolder) {
      alert('Please select a source folder');
      return;
    }

    setCaptionGenerating(true);
    setProcessedFiles([]);
    setCaptionProgress(0);
    setCurrentFile('');
    setTotalFiles(0);
    
    try {
      const config: BatchCaptionConfig = {
        model: captionModel,
        sourceFolder: captionSourceFolder,
        template: captionTemplate,
        overwrite: overwriteCaptions,
        style: 'detailed',
      };

      // Call Python batch caption generation script
      console.log('Starting caption generation with config:', config);
      const result = await window.api.python.generateBatchCaptions(config);
      
      if (result.processedFiles) {
        setProcessedFiles(result.processedFiles);
      }
      
      alert(`Caption generation completed! Processed ${result.totalProcessed || 0} images.`);
    } catch (error) {
      console.error('Error generating captions:', error);
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error during caption generation: ${errorMessage}\n\nCheck the console for more details.`);
    } finally {
      setCaptionGenerating(false);
      setCaptionProgress(0);
      setCurrentFile('');
    }
  };

  const renderDatasetManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Dataset Folders
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <FileSelector
                label="Dataset Path"
                value={datasetPath}
                onChange={setDatasetPath}
                isDirectory
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddDataset}
                startIcon={<AddIcon />}
                disabled={!datasetPath}
              >
                Add
              </Button>
            </Box>

            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
              <List>
                {datasets.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No datasets added" 
                      secondary="Add dataset folders to begin training"
                    />
                  </ListItem>
                ) : (
                  datasets.map((dataset, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={dataset} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveDataset(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bucket Configuration</Typography>
            <TextField
              fullWidth
              type="number"
              label="Bucket Resolution"
              value={bucketResolution}
              onChange={(e) => setBucketResolution(Number(e.target.value))}
              inputProps={{ min: 64, step: 64 }}
              helperText="Resolution for image buckets (multiple of 64)"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Max Bucket Size"
              value={bucketSizeLimit}
              onChange={(e) => setBucketSizeLimit(Number(e.target.value))}
              inputProps={{ min: 256 }}
              helperText="Maximum resolution for image buckets"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              sx={{ mb: 1 }}
              disabled={datasets.length === 0}
            >
              Validate Datasets
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              fullWidth
              disabled={datasets.length === 0}
            >
              Generate Statistics
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderImagePreprocessing = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Select images from your computer and resize/convert them for training. 
          This will prepare your images in the optimal format and resolution.
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ImageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Source & Output
            </Typography>
            
            <FileSelector
              label="Source Folder (Images)"
              value={sourceFolder}
              onChange={setSourceFolder}
              isDirectory
              helperText="Folder containing original images"
            />
            
            <Box sx={{ mt: 2 }}>
              <FileSelector
                label="Output Folder"
                value={outputFolder}
                onChange={setOutputFolder}
                isDirectory
                helperText="Where processed images will be saved"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ProcessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Processing Settings
            </Typography>
            
            <TextField
              fullWidth
              type="number"
              label="Target Size (pixels)"
              value={targetSize}
              onChange={(e) => setTargetSize(Number(e.target.value))}
              inputProps={{ min: 256, max: 2048, step: 64 }}
              helperText="Output image size (square)"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Resize Mode</InputLabel>
              <Select
                value={resizeMode}
                onChange={(e) => setResizeMode(e.target.value as 'keep_ratio' | 'fill' | 'crop')}
              >
                <MenuItem value="crop">Smart Crop (Maintain Aspect)</MenuItem>
                <MenuItem value="fill">Resize (May Distort)</MenuItem>
                <MenuItem value="keep_ratio">Keep Ratio with Padding</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={convertFormat}
                onChange={(e) => setConvertFormat(e.target.value)}
              >
                <MenuItem value="jpg">JPEG</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="webp">WebP</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="JPEG Quality"
              value={jpegQuality}
              onChange={(e) => setJpegQuality(Number(e.target.value))}
              inputProps={{ min: 60, max: 100 }}
              helperText="Quality for JPEG output (60-100)"
              disabled={convertFormat !== 'jpg'}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Start Processing</Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handlePreprocessImages}
                disabled={!sourceFolder || !outputFolder || processing}
                startIcon={processing ? <RefreshIcon className="spinning" /> : <ProcessIcon />}
              >
                {processing ? 'Processing Images...' : 'Process Images'}
              </Button>
            </Box>
            
            {processing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Processing images, please wait...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCaptionGeneration = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Generate descriptive captions for your images using AI models. 
          These captions will be used to train your LoRA model.
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CaptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Source Images
            </Typography>
            
            <FileSelector
              label="Image Folder"
              value={captionSourceFolder}
              onChange={setCaptionSourceFolder}
              isDirectory
              helperText={
                captionSourceFolder === outputFolder && outputFolder
                  ? "📁 Automatically set from image preprocessing output"
                  : "Folder containing images to caption"
              }
            />

            {captionSourceFolder === outputFolder && outputFolder && (
              <Alert severity="success" sx={{ mt: 1, mb: 2 }}>
                ✨ Ready for caption generation! This folder contains your preprocessed images.
              </Alert>
            )}

            {outputFolder && captionSourceFolder !== outputFolder && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCaptionSourceFolder(outputFolder)}
                  startIcon={<FolderIcon />}
                >
                  Use Preprocessed Images Folder
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Click to use: {outputFolder}
                </Typography>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={overwriteCaptions}
                  onChange={(e) => setOverwriteCaptions(e.target.checked)}
                />
              }
              label="Overwrite existing captions"
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Caption Settings</Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Caption Model</InputLabel>
              <Select
                value={captionModel}
                onChange={(e) => setCaptionModel(e.target.value as 'gpt-4-vision' | 'blip' | 'blip2' | 'vit-gpt2' | 'florence-2')}
              >
                <MenuItem value="florence-2">Florence-2 (Recommended, Detailed)</MenuItem>
                <MenuItem value="blip">BLIP (Fast, General)</MenuItem>
                <MenuItem value="blip2">BLIP-2 (Better Quality)</MenuItem>
                <MenuItem value="git-large">GIT-Large (Detailed)</MenuItem>
                <MenuItem value="vit-gpt2">ViT-GPT2 (Creative)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Caption Template (Optional)"
              value={captionTemplate}
              onChange={(e) => setCaptionTemplate(e.target.value)}
              placeholder="e.g., 'A photo of {caption}' or leave empty for raw captions"
              helperText="Use {caption} as placeholder for generated text"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Generate Captions</Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateCaptions}
                disabled={!captionSourceFolder || captionGenerating}
                startIcon={captionGenerating ? <RefreshIcon className="spinning" /> : <CaptionIcon />}
              >
                {captionGenerating ? 'Generating Captions...' : 'Generate Captions'}
              </Button>
            </Box>
            
            {captionGenerating && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant={totalFiles > 0 ? "determinate" : "indeterminate"}
                      value={totalFiles > 0 ? (captionProgress / totalFiles) * 100 : 0}
                    />
                  </Box>
                  {totalFiles > 0 && (
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {captionProgress}/{totalFiles}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Generating captions using {captionModel} model
                </Typography>
                {currentFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    Processing: {currentFile.split(/[/\\]/).pop()}
                  </Typography>
                )}
              </Box>
            )}

            {processedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recently Processed Files:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
                  {processedFiles.slice(0, 20).map((file, index) => (
                    <Chip key={index} label={file} size="small" />
                  ))}
                  {processedFiles.length > 20 && (
                    <Chip label={`+${processedFiles.length - 20} more`} size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Image Grid for Caption Editing */}
      {loadedImages.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Image Captions Editor</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleUpdateCaptions}
                  disabled={loadedImages.length === 0}
                  startIcon={<AddIcon />}
                >
                  Update Modified Captions ({loadedImages.filter(img => img.isModified).length})
                </Button>
              </Box>
              
              {loadingImages && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading images...
                  </Typography>
                </Box>
              )}

              <ImageList variant="masonry" cols={3} gap={16}>
                {loadedImages.map((image, index) => (
                  <ImageListItem key={image.filename}>
                    <Box sx={{ border: image.isModified ? '2px solid #ff9800' : '1px solid #ddd', borderRadius: 1, p: 1, position: 'relative' }}>
                      {/* Delete button */}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: 'error.dark'
                          },
                          zIndex: 1
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      
                      <img
                        src={`file://${image.path}`}
                        alt={image.filename}
                        style={{
                          width: '100%',
                          height: '256px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={image.caption}
                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                        placeholder="Caption will appear here after generation..."
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: image.isModified ? '#fff3e0' : '#fafafa'
                          }
                        }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        {image.filename}
                        {image.isModified && <span style={{ color: '#ff9800', marginLeft: '8px' }}>● Modified</span>}
                      </Typography>
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
              
              {loadedImages.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  📝 Total images: {loadedImages.length} | 
                  ✏️ Modified: {loadedImages.filter(img => img.isModified).length}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Dataset Configuration for LoRA Training */}
      {loadedImages.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dataset Configuration for LoRA Training
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Dataset Name"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g., my_character_lora"
                    helperText="Name for your LoRA training dataset"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Trigger Word"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g., ohwx woman, my_character"
                    helperText="Unique word/phrase to trigger your LoRA"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'end', height: '100%' }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleGenerateDatasetToml}
                      disabled={!datasetName.trim() || loadedImages.length === 0}
                      startIcon={<SettingsIcon />}
                      fullWidth
                      sx={{ mb: 2.5 }}
                    >
                      Generate dataset.toml
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Dataset Description (Optional)"
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    placeholder="Brief description of your dataset..."
                    helperText="Optional description for documentation"
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                📋 <strong>Dataset Summary:</strong> {loadedImages.length} total images, {loadedImages.filter(img => img.caption.trim()).length} with captions
                {datasetName && ` | Output: ${datasetName.toLowerCase().replace(/\s+/g, '_')}.safetensors`}
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dataset Management
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<FolderIcon />} label="Datasets" />
          <Tab icon={<ImageIcon />} label="Preprocess Images" />
          <Tab icon={<CaptionIcon />} label="Generate Captions" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderDatasetManagement()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderImagePreprocessing()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderCaptionGeneration()}
        </TabPanel>
      </Paper>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default DatasetManager;
