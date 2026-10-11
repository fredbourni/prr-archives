import { Autocomplete, TextField, Chip } from '@mui/material';
import TagIcon from '@mui/icons-material/LocalOffer';

interface TagFilterProps {
  value: string[];
  tags: string[];
  onChange: (value: string[]) => void;
}

export const TagFilter = ({ value, tags, onChange }: TagFilterProps) => {
  return (
    <Autocomplete
      multiple
      size="small"
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      options={tags}
      limitTags={2}
      sx={{
        minWidth: { xs: '100%', sm: '240px' },
        flexGrow: { xs: 1, sm: 0 },
        '& .MuiInputBase-root': {
          height: { xs: '32px', sm: '40px' },
          minHeight: { xs: '32px', sm: '40px' },
          py: 0,
          pr: 0.5,
        },
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={option}
              size="small"
              icon={<TagIcon sx={{ fontSize: '0.9rem !important' }} />}
              {...rest}
              sx={{ height: { xs: 22, sm: 26 }, fontSize: '0.7rem' }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length === 0 ? 'Tags' : ''}
          variant="outlined"
        />
      )}
      ChipProps={{ size: 'small' }}
    />
  );
};
