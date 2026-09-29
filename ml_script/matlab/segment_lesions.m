%% segment_lesions.m
% RetinaScan-XAI - MATLAB Lesion Segmentation Pipeline
% =====================================================
% Detects diabetic retinopathy lesions using morphological operations.
% These are the same lesions the ResNet-50 IMPLICITLY learned to detect.
% This MATLAB script makes them EXPLICIT and countable.
%
% Lesions detected:
%   1. Microaneurysms (MA)  - tiny dark red dots, earliest sign of DR
%   2. Haemorrhages (HEM)   - larger dark blobs
%   3. Hard Exudates (EX)   - bright yellowish lipid deposits
%
% Usage:
%   [ma_map, hem_map, ex_map, stats] = segment_lesions('retina.jpg');
%
% Requires: MATLAB Image Processing Toolbox

function [ma_map, hem_map, ex_map, lesion_stats] = segment_lesions(image_path)

    % ── Load and preprocess ──────────────────────────────────────────────────
    img     = imread(image_path);
    green   = img(:,:,2);   % green channel: best contrast for dark lesions
    red     = img(:,:,1);   % red channel: used for exudate detection
    
    fprintf('[MATLAB] Segmenting lesions in: %s\n', image_path);

    % CLAHE for local contrast enhancement
    green_eq = adapthisteq(green, 'ClipLimit', 0.02, 'NumTiles', [8,8]);
    
    % ── Step 1: Microaneurysm Detection ─────────────────────────────────────
    % MAs appear as small (2-10px diameter) dark circular structures
    
    % Morphological closing with large disk to estimate background
    se_bg  = strel('disk', 12);
    bg_est = imclose(green_eq, se_bg);
    
    % Subtract background to isolate small dark structures
    residual = bg_est - green_eq;
    
    % Threshold the residual image
    thresh_ma   = graythresh(residual) * 0.6;    % lower threshold = more sensitive
    binary_dark = imbinarize(residual, thresh_ma);
    
    % Size filtering: MAs are 2–10px radius (remove noise & large haemorrhages)
    cc_dark = bwconncomp(binary_dark);
    stats_dark = regionprops(cc_dark, 'Area', 'Circularity', 'Centroid');
    
    ma_map  = false(size(green));
    hem_map = false(size(green));
    
    for i = 1:length(stats_dark)
        area  = stats_dark(i).Area;
        circ  = stats_dark(i).Circularity;
        if area >= 4 && area <= 150 && circ >= 0.4
            % Small, roughly circular → Microaneurysm
            ma_map(cc_dark.PixelIdxList{i}) = true;
        elseif area > 150 && area < 3000
            % Larger blob → Haemorrhage
            hem_map(cc_dark.PixelIdxList{i}) = true;
        end
    end
    
    % Morphological refinement
    ma_map  = imfill(ma_map, 'holes');
    ma_map  = imdilate(ma_map, strel('disk', 2));
    hem_map = imfill(hem_map, 'holes');
    
    fprintf('  Microaneurysms detected:  %d\n', sum(bwlabel(ma_map)(:) > 0));
    fprintf('  Haemorrhages detected:    %d\n', bwlabeln(hem_map));
    
    % ── Step 2: Hard Exudate Detection ──────────────────────────────────────
    % Exudates appear as BRIGHT yellowish clusters in the red/green channels
    
    % Normalize combined red+green channel
    bright_ch = (double(red) + double(green)) / 2;
    bright_ch = uint8(bright_ch);
    bright_eq = adapthisteq(bright_ch, 'ClipLimit', 0.01);
    
    % Detect bright regions
    thresh_ex = graythresh(bright_eq) + 0.15;    % higher threshold = only very bright
    bright_mask = imbinarize(bright_eq, min(thresh_ex, 0.85));
    
    % Remove optic disc (large bright circular region in nasal quadrant)
    % Optic disc is typically > 5000 px^2; exudates are smaller clusters
    bright_mask = bwareaopen(bright_mask, 20);     % remove tiny noise
    cc_bright   = bwconncomp(bright_mask);
    s_bright    = regionprops(cc_bright, 'Area');
    
    ex_map = false(size(green));
    for i = 1:length(s_bright)
        if s_bright(i).Area < 5000    % exclude optic disc
            ex_map(cc_bright.PixelIdxList{i}) = true;
        end
    end
    
    fprintf('  Hard exudates detected:   %d clusters\n', bwlabeln(ex_map));
    
    % ── Build stats struct ───────────────────────────────────────────────────
    lesion_stats = struct(...
        'ma_count',     bwlabeln(ma_map), ...
        'hem_count',    bwlabeln(hem_map), ...
        'ex_count',     bwlabeln(ex_map), ...
        'ma_area_px',   sum(ma_map(:)), ...
        'hem_area_px',  sum(hem_map(:)), ...
        'ex_area_px',   sum(ex_map(:)) ...
    );
    
    % ── Visualise overlay ────────────────────────────────────────────────────
    figure('Name', 'RetinaScan-XAI Lesion Map', 'NumberTitle', 'off');
    overlay = double(img) / 255;
    
    % Colour-code lesions: MA=red, HEM=magenta, EX=yellow
    overlay(:,:,1) = overlay(:,:,1) + 0.6 * double(ma_map)  + 0.4 * double(hem_map);
    overlay(:,:,2) = overlay(:,:,2) + 0.5 * double(ex_map);
    overlay(:,:,3) = overlay(:,:,3) - 0.3 * double(ma_map);
    overlay = min(max(overlay, 0), 1);
    
    subplot(2,3,1); imshow(img);            title('Original Fundus');
    subplot(2,3,2); imshow(green_eq);       title('Green Ch. (CLAHE)');
    subplot(2,3,3); imshow(overlay);        title('Lesion Overlay');
    subplot(2,3,4); imshow(ma_map);         title(sprintf('Microaneurysms (n=%d)', lesion_stats.ma_count));
    subplot(2,3,5); imshow(hem_map);        title(sprintf('Haemorrhages (n=%d)',   lesion_stats.hem_count));
    subplot(2,3,6); imshow(ex_map);         title(sprintf('Exudates (n=%d)',       lesion_stats.ex_count));
    sgtitle('RetinaScan-XAI | MATLAB Lesion Segmentation');
    
    fprintf('[DONE] Lesion segmentation complete.\n');
end


%% Helper: count connected components
function n = bwlabeln(bw)
    L = bwlabel(bw);
    n = max(L(:));
end
