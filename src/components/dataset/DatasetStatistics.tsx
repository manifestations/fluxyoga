import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tab,
  Tabs,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Dataset as DatasetIcon,
  Image as ImageIcon,
  Tag as TagIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface DatasetStats {
  totalImages: number;
  totalSize: number; // bytes
  averageResolution: { width: number; height: number };
  resolutionDistribution: { [key: string]: number };
  formatDistribution: { [key: string]: number };
  captionStats: {
    totalCaptions: number;
    averageLength: number;
    emptyCaption: number;
  };
  tagStats: {
    totalTags: number;
    uniqueTags: number;
    averageTagsPerImage: number;
    topTags: Array<{ tag: string; count: number }>;
  };
  issues: Array<{
    type: 'missing_caption' | 'missing_image' | 'invalid_format' | 'duplicate';
    message: string;
    file: string;
  }>;
  buckets?: { [key: string]: number };
}

interface DatasetFile {
  path: string;
  caption: string;
  tags: string[];
  resolution: { width: number; height: number };
  size: number;
  format: string;
  issues: string[];
}

const DatasetStatistics: React.FC<{ datasetPath: string }> = ({ datasetPath }) => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (datasetPath) {
      analyzeDataset();
    }
  }, [datasetPath]);

  const analyzeDataset = async () => {
    if (!datasetPath) return;

    setLoading(true);
    try {
      // For now, generate mock data
      // TODO: Implement actual dataset analysis
      const mockStats: DatasetStats = {
        totalImages: 1250,
        totalSize: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
        averageResolution: { width: 768, height: 768 },
        resolutionDistribution: {
          '512x512': 150,
          '768x768': 800,
          '1024x1024': 200,
          '512x768': 75,
          '768x512': 25,
        },
        formatDistribution: {
          'jpg': 800,
          'png': 400,
          'webp': 50,
        },
        captionStats: {
          totalCaptions: 1200,
          averageLength: 45,
          emptyCaption: 50,
        },
        tagStats: {
          totalTags: 15000,
          uniqueTags: 2500,
          averageTagsPerImage: 12,
          topTags: [
            { tag: '1girl', count: 800 },
            { tag: 'solo', count: 750 },
            { tag: 'looking at viewer', count: 600 },
            { tag: 'long hair', count: 550 },
            { tag: 'brown hair', count: 400 },
            { tag: 'smile', count: 380 },
            { tag: 'blue eyes', count: 350 },
            { tag: 'simple background', count: 300 },
            { tag: 'white background', count: 280 },
            { tag: 'upper body', count: 250 },
          ],
        },
        issues: [
          { type: 'missing_caption', message: 'Missing caption file', file: 'image_001.jpg' },
          { type: 'invalid_format', message: 'Unsupported image format', file: 'image_002.gif' },
          { type: 'missing_image', message: 'Caption file without image', file: 'image_003.txt' },
          { type: 'duplicate', message: 'Duplicate image detected', file: 'image_004.jpg' },
        ],
        buckets: {
          '512x512': 150,
          '768x768': 800,
          '1024x1024': 200,
          'other': 100,
        },
      };

      setStats(mockStats);

      // Generate mock file list
      const mockFiles: DatasetFile[] = Array.from({ length: 50 }, (_, i) => ({
        path: `image_${String(i + 1).padStart(3, '0')}.jpg`,
        caption: `A detailed caption for image ${i + 1}`,
        tags: ['1girl', 'solo', 'looking at viewer', 'smile'].slice(0, Math.floor(Math.random() * 4) + 1),
        resolution: { width: 768, height: 768 },
        size: Math.floor(Math.random() * 500000) + 100000,
        format: 'jpg',
        issues: i % 10 === 0 ? ['low_resolution'] : [],
      }));

      setFiles(mockFiles);
    } catch (error) {
      console.error('Error analyzing dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ImageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Images</Typography>
            </Box>
            <Typography variant="h4">{stats?.totalImages.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DatasetIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Dataset Size</Typography>
            </Box>
            <Typography variant="h4">{stats ? formatFileSize(stats.totalSize) : '0 MB'}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TagIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Unique Tags</Typography>
            </Box>
            <Typography variant="h4">{stats?.tagStats.uniqueTags.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Issues Found</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats?.issues.length || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Resolution Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Resolution Distribution</Typography>
            {stats?.resolutionDistribution && Object.entries(stats.resolutionDistribution).map(([resolution, count]) => (
              <Box key={resolution} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{resolution}</Typography>
                  <Typography variant="body2">{count} images</Typography>
                </Box>
                <Box sx={{ width: '100%', mt: 0.5 }}>
                  <div style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 4,
                  }}>
                    <div style={{
                      width: `${(count / (stats?.totalImages || 1)) * 100}%`,
                      height: '100%',
                      backgroundColor: '#1976d2',
                      borderRadius: 4,
                    }} />
                  </div>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Format Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Format Distribution</Typography>
            {stats?.formatDistribution && Object.entries(stats.formatDistribution).map(([format, count]) => (
              <Box key={format} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{format.toUpperCase()}</Typography>
                  <Typography variant="body2">{count} files</Typography>
                </Box>
                <Box sx={{ width: '100%', mt: 0.5 }}>
                  <div style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 4,
                  }}>
                    <div style={{
                      width: `${(count / (stats?.totalImages || 1)) * 100}%`,
                      height: '100%',
                      backgroundColor: '#2e7d32',
                      borderRadius: 4,
                    }} />
                  </div>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTagStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Top Tags</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Frequency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.tagStats.topTags.map((tag) => (
                    <TableRow key={tag.tag}>
                      <TableCell>
                        <Chip label={tag.tag} size="small" />
                      </TableCell>
                      <TableCell align="right">{tag.count}</TableCell>
                      <TableCell align="right">
                        {((tag.count / (stats?.totalImages || 1)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Tag Summary</Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Total Tags"
                  secondary={stats?.tagStats.totalTags.toLocaleString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Unique Tags"
                  secondary={stats?.tagStats.uniqueTags.toLocaleString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Average Tags per Image"
                  secondary={stats?.tagStats.averageTagsPerImage.toFixed(1)}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderIssues = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {stats?.issues.length === 0 ? (
          <Alert severity="success">
            No issues found in the dataset!
          </Alert>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Dataset Issues</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>File</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.issues.map((issue, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            label={issue.type.replace('_', ' ')}
                            color={issue.type === 'duplicate' ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{issue.message}</TableCell>
                        <TableCell>{issue.file}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderFiles = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Dataset Files</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Resolution</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Issues</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((file, index) => (
                <TableRow key={index}>
                  <TableCell>{file.path}</TableCell>
                  <TableCell>{file.resolution.width} × {file.resolution.height}</TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {file.tags.slice(0, 3).map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                      {file.tags.length > 3 && (
                        <Chip label={`+${file.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {file.issues.length > 0 ? (
                      <Chip label={file.issues.length} color="warning" size="small" />
                    ) : (
                      <Chip label="OK" color="success" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={files.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
        />
      </CardContent>
    </Card>
  );

  if (!datasetPath) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <DatasetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Select a dataset to view statistics
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Dataset Statistics</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={analyzeDataset}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Tags" />
          <Tab label="Issues" />
          <Tab label="Files" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <div>Analyzing dataset...</div>
        </Box>
      ) : (
        <>
          {tabValue === 0 && renderOverview()}
          {tabValue === 1 && renderTagStats()}
          {tabValue === 2 && renderIssues()}
          {tabValue === 3 && renderFiles()}
        </>
      )}
    </Box>
  );
};

export default DatasetStatistics;
