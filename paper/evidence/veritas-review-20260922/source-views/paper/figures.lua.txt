function Figure(figure)
  if not FORMAT:match('latex') then return nil end
  local image = figure.content[1].content[1]
  if image.t ~= 'Image' then error('Expected one image per figure') end
  local caption = pandoc.write(pandoc.Pandoc(figure.caption.long), 'latex')
  return pandoc.RawBlock('latex',
    '\\begin{figure}[!htbp]\n\\centering\n' ..
    '\\includegraphics[width=\\linewidth,height=0.70\\textheight,keepaspectratio]{' .. image.src .. '}\n' ..
    '\\caption{' .. caption .. '}\\label{' .. figure.identifier .. '}\n\\end{figure}')
end

function Header(header)
  if FORMAT:match('latex') and header.identifier == 'abstract' then
    return pandoc.RawBlock('latex', '\\section*{Abstract}\\label{abstract}')
  end
end

function Table(table)
  if pandoc.utils.stringify(table.head.rows[1].cells[2]) == 'Status' then
    table.colspecs = {{pandoc.AlignLeft, 0.38}, {pandoc.AlignLeft, 0.14}, {pandoc.AlignLeft, 0.48}}
  end
  return table
end
