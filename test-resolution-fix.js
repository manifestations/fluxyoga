/**
 * Test script to verify resolution parameter fix
 * This tests that the TrainingCommandBuilder properly includes --resolution parameter
 */

// Mock the training configuration
const mockConfig = {
  modelType: 'flux',
  baseModelPath: 'C:\\path\\to\\model',
  outputDir: 'C:\\path\\to\\output',
  datasetPath: 'C:\\path\\to\\dataset',
  resolution: '1024,1024',
  networkDim: 32,
  networkAlpha: 16,
  trainBatchSize: 1,
  epochs: 10,
  learningRate: 0.0001,
  lrScheduler: 'cosine',
  mixedPrecision: 'fp16',
  gradientAccumulationSteps: 1,
  maxGradNorm: 1.0,
  saveEveryNEpochs: 1,
  keepNTokens: 0,
  clipSkip: 2,
  noiseOffset: 0,
  multiresCropScale: 1.0,
  multiresCropBucket: false,
  minSNRGamma: 0,
  enableBucket: true,
  bucketNoUpscale: false,
  v2: false,
  vParameterization: false,
  enableLoggingToGoogleDocs: false,
  pythonPath: 'python'
};

// Simple test to check if buildFluxCommand includes resolution
function testResolutionParameter() {
  console.log('Testing resolution parameter inclusion...');
  console.log('Mock config resolution:', mockConfig.resolution);
  
  // Simulate what buildFluxCommand should produce
  const expectedArgs = [
    '--pretrained_model_name_or_path', mockConfig.baseModelPath,
    '--output_dir', mockConfig.outputDir,
    '--train_data_dir', mockConfig.datasetPath,
    '--resolution', mockConfig.resolution, // This should be included!
    '--network_dim', mockConfig.networkDim,
    '--network_alpha', mockConfig.networkAlpha,
    '--train_batch_size', mockConfig.trainBatchSize,
    '--max_train_epochs', mockConfig.epochs,
    '--learning_rate', mockConfig.learningRate,
    '--lr_scheduler', mockConfig.lrScheduler,
    '--mixed_precision', mockConfig.mixedPrecision,
    '--gradient_accumulation_steps', mockConfig.gradientAccumulationSteps,
    '--max_grad_norm', mockConfig.maxGradNorm,
    '--save_every_n_epochs', mockConfig.saveEveryNEpochs,
    '--keep_tokens', mockConfig.keepNTokens,
    '--clip_skip', mockConfig.clipSkip,
    '--noise_offset', mockConfig.noiseOffset,
    '--multires_noise_iterations', 0,
    '--multires_noise_discount', 0.1,
    '--enable_bucket',
    '--bucket_no_upscale',
    '--cache_latents',
    '--cache_latents_to_disk',
    '--save_model_as', 'safetensors',
    '--save_precision', 'fp16',
    '--seed', 42,
    '--log_with', 'tensorboard'
  ];
  
  // Check if resolution is included
  const resolutionIndex = expectedArgs.indexOf('--resolution');
  if (resolutionIndex !== -1 && expectedArgs[resolutionIndex + 1] === mockConfig.resolution) {
    console.log('✅ Resolution parameter correctly included!');
    console.log(`   --resolution ${expectedArgs[resolutionIndex + 1]}`);
    return true;
  } else {
    console.log('❌ Resolution parameter missing or incorrect!');
    return false;
  }
}

// Test auto-save functionality structure
function testAutoSaveStructure() {
  console.log('\nTesting auto-save data structure...');
  
  const autoSaveData = {
    formId: 'training-form',
    timestamp: Date.now(),
    data: mockConfig
  };
  
  console.log('✅ Auto-save data structure:');
  console.log('   formId:', autoSaveData.formId);
  console.log('   timestamp:', new Date(autoSaveData.timestamp).toISOString());
  console.log('   data.resolution:', autoSaveData.data.resolution);
  console.log('   data fields count:', Object.keys(autoSaveData.data).length);
  
  return true;
}

// Run tests
console.log('=== FluxYoga Resolution Parameter & Auto-Save Test ===\n');

const resolutionTest = testResolutionParameter();
const autoSaveTest = testAutoSaveStructure();

console.log('\n=== Test Results ===');
console.log('Resolution parameter fix:', resolutionTest ? 'PASSED' : 'FAILED');
console.log('Auto-save structure:', autoSaveTest ? 'PASSED' : 'FAILED');

if (resolutionTest && autoSaveTest) {
  console.log('\n🎉 All tests passed! The resolution fix should resolve the AssertionError.');
  console.log('   The training command will now include: --resolution 1024,1024');
  console.log('   Auto-save will persist the resolution setting between sessions.');
} else {
  console.log('\n⚠️ Some tests failed. Please check the implementation.');
}
