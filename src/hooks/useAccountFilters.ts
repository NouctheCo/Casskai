import { useState } from 'react';

export function useAccountFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return {
    searchTerm,
    setSearchTerm,
    classFilter,
    setClassFilter,
    typeFilter,
    setTypeFilter
  };
}