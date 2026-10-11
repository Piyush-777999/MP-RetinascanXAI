%% preprocess_retina.m
% RetinaScan-XAI - MATLAB Retinal Image Preprocessing Pipeline
% ============================================================
% Uses MATLAB Image Processing Toolbox to enhance fundus images
% before feeding into the ResNet-50 classifier.
%
% Steps:
%   1. Extract green channel (highest contrast for DR lesions)
%   2. CLAHE (Contrast Limited Adaptive Histogram Equalization)
%   3. Frangi vessel filter (blood vessel enhancement)
%   4. Background normalisation (remove camera vignetting)
%
% Usage (in MATLAB command window):
%   enhanced = preprocess_retina('path/to/image.jpg');
%   imshow(enhanced);
%
% Usage (batch - process a whole folder):
%   preprocess_retina_batch('input_folder/', 'output_folder/');

function enhanced = preprocess_retina(image_path)
    % ── Load image ──────────────────────────────────────────────────────────
    img = imread(image_path);
    
    if size(img, 3) == 1
        img = cat(3, img, img, img);   % handle grayscale input
    end
    
    fprintf('[MATLAB] Preprocessing: %s\n', image_path);
    
    % ── Step 1: Extract green channel ────────────────────────────────────────
    % Green channel has highest contrast for microaneurysms and haemorrhages
    green_ch = img(:,:,2);
    fprintf('  Step 1: Green channel extracted (%dx%d)\n', size(green_ch,1), size(green_ch,2));
    
    % ── Step 2: CLAHE ────────────────────────────────────────────────────────
    % Enhances local contrast while limiting noise amplification
    green_norm = adapthisteq(green_ch, ...
        'ClipLimit',    0.02, ...
        'Distribution', 'rayleigh', ...
        'NumTiles',     [8, 8]);
    fprintf('  Step 2: CLAHE applied (ClipLimit=0.02, 8x8 tiles)\n');
    
    % ── Step 3: Background normalisation ─────────────────────────────────────
    % Estimate and remove the illumination gradient (camera vignetting)
    bg = imgaussfilt(green_norm, 30);    % large-sigma Gaussian = background
    green_norm = green_norm - bg;
    green_norm = green_norm - min(green_norm(:));  % shift to [0, max]
    green_norm = uint8(255 * double(green_norm) / double(max(green_norm(:))));
    fprintf('  Step 3: Background illumination normalised\n');
    
    % ── Step 4: Vessel enhancement (Frangi filter) ────────────────────────────
    % Frangi filter detects tubular structures (blood vessels)
    % Uses multi-scale second-order Hessian eigenvalue analysis
    green_double = im2double(green_norm);
    vessel_map   = frangiFiltration(green_double, [1, 2, 3], true);
    vessel_enhanced = green_double + 0.3 * vessel_map;
    vessel_enhanced = mat2gray(vessel_enhanced);
    fprintf('  Step 4: Frangi vessel enhancement applied\n');
    
    % ── Step 5: Reconstruct 3-channel output ─────────────────────────────────
    % Return as RGB: enhanced green in all channels for compatibility
    enhanced_uint8 = im2uint8(vessel_enhanced);
    enhanced = cat(3, enhanced_uint8, enhanced_uint8, enhanced_uint8);
    fprintf('  [DONE] Enhanced image ready (%dx%dx%d)\n', size(enhanced,1), size(enhanced,2), size(enhanced,3));
    
    % ── Optional: show comparison ─────────────────────────────────────────────
    figure('Name', 'RetinaScan-XAI Preprocessing', 'NumberTitle', 'off');
    subplot(1,3,1); imshow(img);         title('Original');
    subplot(1,3,2); imshow(green_ch);    title('Green Channel');
    subplot(1,3,3); imshow(enhanced);    title('Enhanced (CLAHE + Vessel)');
    sgtitle('RetinaScan-XAI | MATLAB Preprocessing Pipeline');
end


%% Batch processing helper
function preprocess_retina_batch(input_dir, output_dir)
    if ~exist(output_dir, 'dir')
        mkdir(output_dir);
    end
    
    exts = {'*.jpg', '*.png', '*.tif', '*.jpeg'};
    files = [];
    for e = 1:length(exts)
        files = [files; dir(fullfile(input_dir, exts{e}))]; %#ok<AGROW>
    end
    
    fprintf('[MATLAB] Batch processing %d images...\n', length(files));
    
    for i = 1:length(files)
        src  = fullfile(input_dir, files(i).name);
        dst  = fullfile(output_dir, files(i).name);
        enhanced = preprocess_retina(src);
        imwrite(enhanced, dst);
        fprintf('  Saved: %s\n', dst);
    end
    
    fprintf('[DONE] Batch complete.\n');
end


%% Frangi vessel filter implementation
% Reference: Frangi et al. (1998) "Multiscale vessel enhancement filtering"
function vesselness = frangiFiltration(img, scales, blackRidges)
    if nargin < 3, blackRidges = true; end
    
    vesselness = zeros(size(img));
    
    for sigma = scales
        % Gaussian smoothing at this scale
        smoothed = imgaussfilt(img, sigma);
        
        % Hessian matrix components (second derivatives)
        [Dxx, Dxy, Dyy] = hessian2D(smoothed, sigma);
        
        % Eigenvalues of the Hessian
        [~, L2] = eig2D(Dxx, Dxy, Dyy);
        
        % Flip sign for black ridges (dark vessels on bright background)
        if blackRidges
            L2 = -L2;
        end
        
        % Vesselness measure
        v = max(L2, 0);
        vesselness = max(vesselness, v);
    end
    
    % Normalise
    if max(vesselness(:)) > 0
        vesselness = vesselness / max(vesselness(:));
    end
end

function [Dxx, Dxy, Dyy] = hessian2D(img, sigma)
    [xx, xy]  = gradient(img);
    [Dxx, Dxy] = gradient(xx);
    [~,   Dyy] = gradient(xy);
    Dxx = sigma^2 * Dxx;
    Dxy = sigma^2 * Dxy;
    Dyy = sigma^2 * Dyy;
end

function [L1, L2] = eig2D(Dxx, Dxy, Dyy)
    tmp = sqrt((Dxx - Dyy).^2 + 4 * Dxy.^2);
    L1  = 0.5 * (Dxx + Dyy + tmp);
    L2  = 0.5 * (Dxx + Dyy - tmp);
    idx = abs(L1) < abs(L2);
    [L1(idx), L2(idx)] = deal(L2(idx), L1(idx));
end
