import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Popper,
  ClickAwayListener,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Task as TaskIcon,
  Folder as ProjectIcon,
  Comment as CommentIcon,
  Person as UserIcon,
  Close as CloseIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import searchService from '../services/searchService';

const ENTITY_ICONS = {
  task: <TaskIcon />,
  project: <ProjectIcon />,
  comment: <CommentIcon />,
  user: <UserIcon />,
};

const ENTITY_COLORS = {
  task: 'primary',
  project: 'success',
  comment: 'warning',
  user: 'info',
};

const GlobalSearch = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const navigate = useNavigate();

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await searchService.getSuggestions(5);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  // Debounced search
  const performSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await searchService.globalSearch(searchQuery, {
          includeComments: true,
          includeUsers: true,
          limit: 15,
        });
        setResults(data.results || []);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setOpen(true);
  };

  const handleResultClick = (result) => {
    setOpen(false);
    setQuery('');

    if (onResultClick) {
      onResultClick(result);
      return;
    }

    // Default navigation
    switch (result.type) {
      case 'task':
        if (result.projectId) {
          navigate(`/projects/${result.projectId}/tasks/${result.id}`);
        }
        break;
      case 'project':
        navigate(`/projects/${result.id}`);
        break;
      case 'user':
        navigate(`/users/${result.id}`);
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} style={{ backgroundColor: '#fff59d', padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 500 }}>
        <TextField
          ref={anchorRef}
          fullWidth
          size="small"
          placeholder="Search tasks, projects, users..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} />}
                {query && !loading && (
                  <IconButton size="small" onClick={handleClear}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        <Popper
          open={open && (results.length > 0 || suggestions.length > 0 || query.length > 0)}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ width: anchorRef.current?.offsetWidth, zIndex: 1300 }}
        >
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {/* Suggestions when no query */}
            {!query && suggestions.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}
                >
                  <TrendingIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Recent searches
                </Typography>
                <List dense>
                  {suggestions.map((suggestion, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <ListItemText
                        primary={suggestion}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Search results */}
            {query && results.length > 0 && (
              <List dense>
                {results.map((result, index) => (
                  <React.Fragment key={`${result.type}-${result.id}`}>
                    {index > 0 && results[index - 1].type !== result.type && (
                      <Divider />
                    )}
                    <ListItem button onClick={() => handleResultClick(result)}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {ENTITY_ICONS[result.type]}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">
                              {highlightMatch(result.title, query)}
                            </Typography>
                            <Chip
                              size="small"
                              label={result.type}
                              color={ENTITY_COLORS[result.type]}
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {result.projectName && `${result.projectName} • `}
                            {result.description?.substring(0, 50)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* No results */}
            {query && query.length >= 2 && results.length === 0 && !loading && (
              <Box p={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No results found for "{query}"
                </Typography>
              </Box>
            )}

            {/* Query too short */}
            {query && query.length < 2 && (
              <Box p={2} textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Type at least 2 characters to search
                </Typography>
              </Box>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default GlobalSearch;
