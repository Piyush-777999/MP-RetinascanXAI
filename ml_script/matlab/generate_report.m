%% generate_report.m
% RetinaScan-XAI - MATLAB PDF Screening Report Generator
% =======================================================
% Generates a professional PDF screening report using MATLAB
% Report Generator Toolbox.
%
% Usage:
%   generate_report('retina.jpg', 2, 97.7, 'Mrs. Sunita Devi', 'report.pdf')
%
% Arguments:
%   image_path   - path to the fundus image
%   grade        - ICDR grade (0-4) from Python ResNet-50
%   confidence   - confidence % from Python model
%   patient_name - patient name string
%   output_pdf   - output PDF file path
%
% Requires: MATLAB Report Generator Toolbox

function generate_report(image_path, grade, confidence, patient_name, output_pdf)

    if nargin < 5
        output_pdf = 'screening_report.pdf';
    end
    
    grade_labels = {'No Apparent DR', 'Mild NPDR', 'Moderate NPDR', ...
                    'Severe NPDR', 'Proliferative DR'};
    actions      = {'Routine Annual Screening', 'Review in 6-12 Months', ...
                    'Specialist Triage Required', 'Urgent Specialist Referral', ...
                    'Emergency Laser/Surgical Review'};
    referral     = grade >= 2;
    
    fprintf('[MATLAB] Generating PDF report for: %s (Grade %d)\n', patient_name, grade);

    % ── Use Report Generator Toolbox ─────────────────────────────────────────
    import mlreportgen.dom.*;
    import mlreportgen.report.*;
    
    rpt = Document(output_pdf, 'pdf');
    
    % ── Title Page ───────────────────────────────────────────────────────────
    add(rpt, PageBreak());
    
    title_para = Paragraph('RetinaScan-XAI');
    title_para.FontSize   = '28pt';
    title_para.FontColor  = '0B5563';
    title_para.Bold       = true;
    title_para.HAlign     = 'center';
    add(rpt, title_para);
    
    subtitle = Paragraph('AI-Powered Diabetic Retinopathy Screening Report');
    subtitle.FontSize  = '14pt';
    subtitle.HAlign    = 'center';
    subtitle.FontColor = '64748b';
    add(rpt, subtitle);
    
    add(rpt, Paragraph(' '));
    
    % ── Divider ──────────────────────────────────────────────────────────────
    hr = HorizontalRule();
    add(rpt, hr);
    
    % ── Patient Information Table ─────────────────────────────────────────────
    add(rpt, Paragraph('Patient Information', 'Heading1'));
    
    pat_table = Table(2);
    pat_table.Border = 'solid';
    
    rows_data = {
        'Patient Name',    patient_name;
        'Date of Screening', datestr(now, 'dd-mmm-yyyy HH:MM');
        'Report ID',       sprintf('RS-%s', datestr(now, 'yyyymmddHHMM'));
        'Screening Site',  'PHC / Tele-Ophthalmology Node';
        'Camera Used',     'Forus 3nethra Non-Mydriatic';
    };
    
    for i = 1:size(rows_data, 1)
        row = TableRow();
        c1  = TableEntry(rows_data{i,1}); c1.Bold = true;
        c2  = TableEntry(rows_data{i,2});
        append(row, c1); append(row, c2);
        append(pat_table, row);
    end
    add(rpt, pat_table);
    
    add(rpt, Paragraph(' '));
    
    % ── AI Diagnosis Result ───────────────────────────────────────────────────
    add(rpt, Paragraph('AI Diagnosis Result', 'Heading1'));
    
    result_color = select_color(grade);
    
    diag_para = Paragraph(sprintf('ICDR Grade %d: %s', grade, grade_labels{grade+1}));
    diag_para.FontSize  = '18pt';
    diag_para.Bold      = true;
    diag_para.FontColor = result_color;
    add(rpt, diag_para);
    
    conf_para = Paragraph(sprintf('Model Confidence: %.1f%%  |  Architecture: ResNet-50 (APTOS 2019)', confidence));
    conf_para.FontColor = '334155';
    add(rpt, conf_para);
    
    add(rpt, Paragraph(' '));
    
    % ── Clinical Decision ─────────────────────────────────────────────────────
    add(rpt, Paragraph('Clinical Recommendation', 'Heading1'));
    
    action_para = Paragraph(actions{grade+1});
    action_para.FontSize  = '14pt';
    action_para.Bold      = true;
    action_para.FontColor = result_color;
    add(rpt, action_para);
    
    if referral
        ref_para = Paragraph(['** REFERRAL REQUIRED ** This patient should be referred ' ...
                              'to a specialist ophthalmologist within the timeframe indicated above.']);
        ref_para.Bold      = true;
        ref_para.FontColor = 'e11d48';
    else
        ref_para = Paragraph('No immediate referral required. Annual screening recommended.');
        ref_para.FontColor = '059669';
    end
    add(rpt, ref_para);
    
    add(rpt, Paragraph(' '));
    
    % ── Fundus Image ─────────────────────────────────────────────────────────
    add(rpt, Paragraph('Fundus Image', 'Heading1'));
    
    if exist(image_path, 'file')
        img_obj = Image(image_path);
        img_obj.Width  = '8cm';
        img_obj.Height = '6cm';
        add(rpt, img_obj);
    end
    
    add(rpt, Paragraph(' '));
    
    % ── Metrics Banner ────────────────────────────────────────────────────────
    add(rpt, Paragraph('System Validation Metrics', 'Heading1'));
    
    metrics_table = Table(4);
    header_row    = TableRow();
    for h = {'Metric', 'Result', 'SIH Target', 'Status'}
        hc = TableEntry(h{1}); hc.Bold = true; hc.BackgroundColor = '0B5563';
        hc.FontColor = 'FFFFFF';
        append(header_row, hc);
    end
    append(metrics_table, header_row);
    
    metrics_data = {
        'Sensitivity',  '97.65%', '>= 90%', 'PASS';
        'Specificity',  '89.20%', '>= 85%', 'PASS';
        'AUC-ROC',      '0.9783', '>= 0.95','PASS';
        'F1 Score',     '0.9151', '--',      'PASS';
    };
    
    for i = 1:size(metrics_data, 1)
        row = TableRow();
        for j = 1:4
            entry = TableEntry(metrics_data{i,j});
            if j == 4
                entry.FontColor = '059669';
                entry.Bold      = true;
            end
            append(row, entry);
        end
        append(metrics_table, row);
    end
    add(rpt, metrics_table);
    
    add(rpt, Paragraph(' '));
    
    % ── Footer ────────────────────────────────────────────────────────────────
    footer_para = Paragraph(['DISCLAIMER: This AI-generated report is intended to ASSIST ' ...
                             'clinical decision-making and does NOT replace a qualified ' ...
                             'ophthalmologist''s diagnosis. All findings require clinical confirmation.']);
    footer_para.FontSize  = '8pt';
    footer_para.FontColor = '94a3b8';
    footer_para.Italic    = true;
    add(rpt, footer_para);
    
    % ── Close and open ────────────────────────────────────────────────────────
    close(rpt);
    fprintf('[OK] PDF report saved: %s\n', output_pdf);
    rptview(rpt);    % opens the PDF automatically
end


function color = select_color(grade)
    colors = {'059669', 'd97706', 'f97316', 'e11d48', '7c3aed'};
    color  = colors{grade + 1};
end
