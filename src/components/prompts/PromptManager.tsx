import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import FileSelector from '../common/FileSelector';

interface PromptSet {
  id: string;
  name: string;
  prompts: string[];
  createdAt: string;
  filePath?: string;
}

interface PromptManagerProps {
  value: string[];
  onChange: (prompts: string[]) => void;
  label?: string;
  helperText?: string;
}

const DEFAULT_PROMPTS = [
  "a beautiful landscape with mountains and a lake",
  "a portrait of a young woman with detailed eyes",
  "a futuristic cityscape at sunset"
];

const PromptManager: React.FC<PromptManagerProps> = ({
  value,
  onChange,
  label = "Sample Prompts",
  helperText = "Enter up to 3 prompts for sample generation"
}) => {
  const [prompts, setPrompts] = useState<string[]>(value.length > 0 ? value : DEFAULT_PROMPTS);
  const [savedPromptSets, setSavedPromptSets] = useState<PromptSet[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [promptSetName, setPromptSetName] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');

  // Load saved prompt sets on component mount
  useEffect(() => {
    loadSavedPromptSets();
  }, []);

  // Update parent component when prompts change
  useEffect(() => {
    onChange(prompts);
  }, [prompts, onChange]);

  const loadSavedPromptSets = async () => {
    try {
      // Load from local storage first
      const localSets = localStorage.getItem('promptSets');
      if (localSets) {
        setSavedPromptSets(JSON.parse(localSets));
      }
      
      // Also load default file if it exists
      await loadDefaultPromptsFile();
    } catch (error) {
      console.error('Error loading prompt sets:', error);
    }
  };

  const loadDefaultPromptsFile = async () => {
    try {
      // Try to load default prompts from localStorage
      const defaultPrompts = localStorage.getItem('defaultPrompts');
      if (defaultPrompts) {
        const lines = JSON.parse(defaultPrompts);
        if (lines.length > 0) {
          setPrompts(lines);
        }
      }
    } catch (error) {
      // Default prompts don't exist, that's okay
      console.log('No default prompts found');
    }
  };

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleAddPrompt = () => {
    if (prompts.length < 3) {
      setPrompts([...prompts, '']);
    }
  };

  const handleRemovePrompt = (index: number) => {
    if (prompts.length > 1) {
      const newPrompts = prompts.filter((_, i) => i !== index);
      setPrompts(newPrompts);
    }
  };

  const handleSavePromptSet = async () => {
    if (!promptSetName.trim()) return;

    const newPromptSet: PromptSet = {
      id: Date.now().toString(),
      name: promptSetName,
      prompts: [...prompts],
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const updatedSets = [...savedPromptSets, newPromptSet];
    setSavedPromptSets(updatedSets);
    localStorage.setItem('promptSets', JSON.stringify(updatedSets));

    // Save to file if requested
    if (selectedFilePath) {
      try {
        const content = prompts.join('\n');
        await window.api.fs.writeFile(selectedFilePath, content);
        newPromptSet.filePath = selectedFilePath;
      } catch (error) {
        console.error('Error saving to file:', error);
      }
    }

    setSaveDialogOpen(false);
    setPromptSetName('');
    setSelectedFilePath('');
  };

  const handleLoadPromptSet = (promptSet: PromptSet) => {
    setPrompts([...promptSet.prompts]);
    setLoadDialogOpen(false);
  };

  const handleLoadFromFile = async () => {
    try {
      const result = await window.api.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const content = await window.api.fs.readFile(result.filePaths[0]);
        const lines = content.split('\n').filter(line => line.trim()).slice(0, 3);
        if (lines.length > 0) {
          setPrompts(lines);
          setLoadDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error loading from file:', error);
    }
  };

  const handleSaveToDefaultFile = async () => {
    try {
      // Save to localStorage as default
      localStorage.setItem('defaultPrompts', JSON.stringify(prompts));
      alert('Prompts saved as default successfully!');
    } catch (error) {
      console.error('Error saving default prompts:', error);
      alert('Error saving default prompts');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{label}</Typography>
          <Box>
            <IconButton
              size="small"
              onClick={() => setLoadDialogOpen(true)}
              title="Load prompts"
            >
              <FolderOpenIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setSaveDialogOpen(true)}
              title="Save prompts"
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleSaveToDefaultFile}
              title="Save as default"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            You can enter up to 3 prompts. Samples will be generated using these prompts during training.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {prompts.map((prompt, index) => (
            <Grid item xs={12} key={index}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`Prompt ${index + 1}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ minWidth: 80 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  placeholder={`Enter prompt ${index + 1}...`}
                  variant="outlined"
                  size="small"
                />
                {prompts.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePrompt(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          ))}

          {prompts.length < 3 && (
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddPrompt}
                size="small"
              >
                Add Prompt ({prompts.length}/3)
              </Button>
            </Grid>
          )}
        </Grid>

        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {helperText}
          </Typography>
        )}

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Save Prompt Set</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Prompt Set Name"
              value={promptSetName}
              onChange={(e) => setPromptSetName(e.target.value)}
              margin="normal"
              placeholder="e.g., Portrait Prompts, Landscape Set"
            />
            <Box sx={{ mt: 2 }}>
              <FileSelector
                label="Save to File (Optional)"
                value={selectedFilePath}
                onChange={setSelectedFilePath}
                isDirectory={false}
                helperText="Choose a file to save prompts to"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSavePromptSet} 
              variant="contained"
              disabled={!promptSetName.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Load Dialog */}
        <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Load Prompt Set</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleLoadFromFile}
                fullWidth
              >
                Load from File
              </Button>
            </Box>
            
            {savedPromptSets.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Saved Prompt Sets:
                </Typography>
                <List>
                  {savedPromptSets.map((promptSet) => (
                    <ListItem
                      key={promptSet.id}
                      button
                      onClick={() => handleLoadPromptSet(promptSet)}
                    >
                      <ListItemText
                        primary={promptSet.name}
                        secondary={`${promptSet.prompts.length} prompts - ${new Date(promptSet.createdAt).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedSets = savedPromptSets.filter(set => set.id !== promptSet.id);
                            setSavedPromptSets(updatedSets);
                            localStorage.setItem('promptSets', JSON.stringify(updatedSets));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoadDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PromptManager;
