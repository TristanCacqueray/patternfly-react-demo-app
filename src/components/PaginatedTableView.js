import React from 'react';
import orderBy from 'lodash.orderby';
import classNames from 'classnames';
import numeral from 'numeral';
import * as sort from 'sortabular';
import * as resolve from 'table-resolver';
import { compose } from 'recompose';
import {
  paginate,
  Button,
  Icon,
  Grid,
  PaginationRow,
  Table,
  Toolbar,
  Popover,
  FormControl,
  Filter,
  OverlayTrigger,
  PAGINATION_VIEW
} from 'patternfly-react';

import rowFilter from './rowFilter';
import searchFilter from './searchFilter';
import CustomToolbarFind from './CustomToolbarFind';
import customSelectionHeaderCellFormatter from './customSelectionHeaderCellFormatter';
import customSelectionCellFormatter from './customSelectionCellFormatter';

import { ZuulApiRoot } from '../pages/constants';
class PaginatedTableView extends React.Component {
  static deselectRow(row) {
    return Object.assign({}, row, { selected: false });
  }
  static selectRow(row) {
    return Object.assign({}, row, { selected: true });
  }
  constructor(props) {
    super(props);

    const getSortingColumns = () => this.state.sortingColumns || {};

    const sortableTransform = sort.sort({
      getSortingColumns,
      onSort: selectedColumn => {
        this.setState({
          sortingColumns: sort.byColumn({
            sortingColumns: this.state.sortingColumns,
            sortingOrder: Table.defaultSortingOrder,
            selectedColumn
          })
        });
      },
      // Use property or index dependening on the sortingColumns structure specified
      strategy: sort.strategies.byProperty
    });

    const sortingFormatter = sort.header({
      sortableTransform,
      getSortingColumns,
      strategy: sort.strategies.byProperty
    });

    // enables our custom header formatters extensions to reactabular
    this.customHeaderFormatters = Table.customHeaderFormattersDefinition;

    const filterTypes = [
      {
        id: 'job_name',
        title: 'Job',
        placeholder: 'Filter by Job Name',
        filterType: 'text'
      },
      {
        id: 'project',
        title: 'Project',
        placeholder: 'Filter by Project Name',
        filterType: 'text'
      },
      {
        id: 'pipeline',
        title: 'Pipeline',
        placeholder: 'Filter by PipelineName',
        filterType: 'text'
      }
    ];

    this.state = {
      // Toolbar Filter state
      filterTypes,
      currentFilterType: filterTypes[0],
      currentValue: '',
      activeFilters: [],
      searchFilterValue: '',

      // Sort the first column in an ascending way by default.
      sortingColumns: {
        name: {
          direction: Table.TABLE_SORT_DIRECTION.ASC,
          position: 0
        }
      },

      // column definitions
      columns: [
        {
          property: 'select',
          header: {
            label: 'Select',
            props: {
              index: 0,
              rowSpan: 1,
              colSpan: 1,
              id: 'select'
            },
            customFormatters: [customSelectionHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 0
            },
            formatters: [
              (value, { rowData, rowIndex }) =>
                customSelectionCellFormatter(
                  { rowData, rowIndex },
                  this.onSelectRow,
                  `select${rowIndex}`,
                  `select ${rowIndex}`
                )
            ]
          }
        },
        {
          property: 'reason',
          header: {
            label: '',
            props: {
              index: 1,
              rowSpan: 1,
              colSpan: 1
            },
            transforms: [sortableTransform],
            customFormatters: [Table.sortableHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 1
            },
            formatters: [
              (value, { rowData }) => (
                <span>
                  <OverlayTrigger
                    overlay={<Popover id="Popover">{rowData.message}</Popover>}
                    placement="right"
                    trigger={['click']}
                    rootClose
                  >
                    <Button bsStyle="link">
                      <Icon type="pf" name={this.iconName(rowData)} />
                    </Button>
                  </OverlayTrigger>
                </span>
              ),
              Table.tableCellFormatter
            ]
          }
        },
        {
          property: 'job_name',
          header: {
            label: 'Job',
            props: {
              index: 2,
              rowSpan: 1,
              colSpan: 1
            },
            transforms: [sortableTransform],
            formatters: [sortingFormatter],
            customFormatters: [Table.sortableHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 1
            },
            formatters: [Table.tableCellFormatter]
          }
        },
        {
          property: 'project',
          header: {
            label: 'Project',
            props: {
              index: 3,
              rowSpan: 1,
              colSpan: 1
            },
            transforms: [sortableTransform],
            formatters: [sortingFormatter],
            customFormatters: [Table.sortableHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 2
            },
            formatters: [Table.tableCellFormatter]
          }
        },
        {
          property: 'pipeline',
          header: {
            label: 'Pipeline',
            props: {
              index: 4,
              rowSpan: 1,
              colSpan: 1
            },
            transforms: [sortableTransform],
            formatters: [sortingFormatter],
            customFormatters: [Table.sortableHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 3
            },
            formatters: [Table.tableCellFormatter]
          }
        },
        {
          property: 'duration',
          header: {
            label: 'Duration',
            props: {
              index: 5,
              rowSpan: 1,
              colSpan: 1
            },
            transforms: [sortableTransform],
            formatters: [sortingFormatter],
            customFormatters: [Table.sortableHeaderCellFormatter]
          },
          cell: {
            props: {
              index: 4
            },
            formatters: [
              (value, { rowData }) => (
                <span>{numeral(rowData.duration).format('0sec')}</span>
              ),
              Table.tableCellFormatter
            ]
          }
        }
      ],

      // rows and row selection state
      rows: [],
      selectedRows: [],

      // pagination default states
      pagination: {
        page: 1,
        perPage: 5,
        perPageOptions: [5, 10, 15]
      },

      // page input value
      pageChangeValue: 1
    };
  }
  iconName = rowData => {
    if (rowData.result === 'SUCCESS') {
      return 'ok';
    }
    if (rowData.result === 'FAILURE') {
      return 'warning-triangle-o';
    }
    return 'error-circle-o';
  };
  onFirstPage = () => {
    this.setPage(1);
  };
  onLastPage = () => {
    const { page } = this.state.pagination;
    const totalPages = this.totalPages();
    if (page < totalPages) {
      this.setPage(totalPages);
    }
  };
  onNextPage = () => {
    const { page } = this.state.pagination;
    if (page < this.totalPages()) {
      this.setPage(this.state.pagination.page + 1);
    }
  };
  onPageInput = e => {
    this.setState({ pageChangeValue: e.target.value });
  };
  onPerPageSelect = (eventKey, e) => {
    const newPaginationState = Object.assign({}, this.state.pagination);
    newPaginationState.perPage = eventKey;
    newPaginationState.page = 1;
    this.setState({ pagination: newPaginationState });
  };
  onPreviousPage = () => {
    if (this.state.pagination.page > 1) {
      this.setPage(this.state.pagination.page - 1);
    }
  };
  onRow = (row, { rowIndex }) => {
    const { rows } = this.state;
    const selected = rows.indexOf(row.id) > -1;
    return {
      className: classNames({
        selected,
        warning: row.conflict,
        danger: row.invalid
      }),
      role: 'row'
    };
  };
  onSelectAllRows = event => {
    const { rows, selectedRows } = this.state;
    const { checked } = event.target;

    const filteredRows = this.filteredSearchedRows();
    const currentRows = this.currentRows(filteredRows).rows;

    if (checked) {
      const selectableRows = currentRows.filter(r => !r.invalid && !r.conflict);
      const updatedSelections = [
        ...new Set([...selectableRows.map(r => r.id), ...selectedRows])
      ];
      const updatedRows = rows.map(
        r =>
          updatedSelections.indexOf(r.id) > -1
            ? PaginatedTableView.selectRow(r)
            : r
      );

      this.setState({
        // important: you must update rows to force a re-render and trigger onRow hook
        rows: updatedRows,
        selectedRows: updatedSelections
      });
    } else {
      const ids = currentRows.map(r => r.id);
      const updatedSelections = selectedRows.filter(
        r => !(ids.indexOf(r) > -1)
      );
      const updatedRows = rows.map(
        r =>
          updatedSelections.indexOf(r.id) > -1
            ? r
            : PaginatedTableView.deselectRow(r)
      );

      this.setState({
        rows: updatedRows,
        selectedRows: updatedSelections
      });
    }
  };
  onSelectRow = (event, row) => {
    const { rows, selectedRows } = this.state;
    const selectedRowIndex = rows.findIndex(r => r.id === row.id);
    if (selectedRowIndex > -1) {
      let updatedSelectedRows;
      let updatedRow;
      if (row.selected) {
        updatedSelectedRows = selectedRows.filter(r => !(r === row.id));
        updatedRow = PaginatedTableView.deselectRow(row);
      } else {
        updatedSelectedRows = [...selectedRows, row.id];
        updatedRow = PaginatedTableView.selectRow(row);
      }
      rows[selectedRowIndex] = updatedRow;

      this.setState({
        rows,
        selectedRows: updatedSelectedRows
      });
    }
  };
  onSubmit = () => {
    this.setPage(this.state.pageChangeValue);
  };
  onValueKeyPress = keyEvent => {
    const { currentValue, currentFilterType } = this.state;

    if (keyEvent.key === 'Enter' && currentValue && currentValue.length > 0) {
      this.setState({ currentValue: '' });
      this.filterAdded(currentFilterType, currentValue);
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
    }
  };
  onFindAction = value => {
    // clear filters and set search text (search and filter are independent for now)
    this.setState({ activeFilters: [], searchFilterValue: value });
  };
  onFindExit = () => {
    this.setState({ searchFilterValue: '' });
  };
  setPage = value => {
    const page = Number(value);
    if (
      !Number.isNaN(value) &&
      value !== '' &&
      page > 0 &&
      page <= this.totalPages()
    ) {
      const newPaginationState = Object.assign({}, this.state.pagination);
      newPaginationState.page = page;
      this.setState({ pagination: newPaginationState, pageChangeValue: page });
    }
  };
  currentRows = filteredRows => {
    const { sortingColumns, columns, pagination } = this.state;

    return compose(
      paginate(pagination),
      sort.sorter({
        columns,
        sortingColumns,
        sort: orderBy,
        strategy: sort.strategies.byProperty
      })
    )(filteredRows);
  };

  totalPages = () => {
    const { rows } = this.state;
    const { perPage } = this.state.pagination;
    return Math.ceil(rows.length / perPage);
  };

  selectFilterType = filterType => {
    const { currentFilterType } = this.state;
    if (currentFilterType !== filterType) {
      this.setState({ currentValue: '', currentFilterType: filterType });
    }
  };

  filterAdded = (field, value) => {
    let filterText = field.title;
    filterText += ': ';
    filterText += value;

    const activeFilters = [
      ...this.state.activeFilters,
      { label: filterText, field, value }
    ];

    this.setState({ activeFilters });
  };

  updateCurrentValue = event => {
    this.setState({ currentValue: event.target.value });
  };

  removeFilter = filter => {
    const { activeFilters } = this.state;

    const index = activeFilters.indexOf(filter);
    if (index > -1) {
      const updated = [
        ...activeFilters.slice(0, index),
        ...activeFilters.slice(index + 1)
      ];
      this.setState({ activeFilters: updated });
    }
  };
  clearFilters = () => {
    this.setState({ activeFilters: [] });
  };
  filteredSearchedRows = () => {
    const { activeFilters, searchFilterValue, rows } = this.state;
    if (activeFilters && activeFilters.length) {
      return rowFilter(activeFilters, rows);
    } else if (searchFilterValue) {
      return searchFilter(searchFilterValue, rows);
    }
    return rows;
  };

  componentDidMount() {
      fetch(ZuulApiRoot + "/builds")
      .then(res => res.json())
      .then(
        (result) => {
            for (var idx = 0; idx < result.length; idx++) {
                result[idx].id = idx;
            }
          this.setState({
            isLoaded: true,
            rows: result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  render() {
    const {
      error,
      isLoaded,
      columns,
      rows,
      pagination,
      sortingColumns,
      pageChangeValue,
      activeFilters,
      filterTypes,
      currentFilterType,
      currentValue,
      selectedRows
    } = this.state;

    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    }
    const filteredRows = this.filteredSearchedRows();
    const sortedPaginatedRows = this.currentRows(filteredRows);

    return (
      <React.Fragment>
        <Grid.Row>
          <Toolbar>
            <Filter>
              <Filter.TypeSelector
                filterTypes={filterTypes}
                currentFilterType={currentFilterType}
                onFilterTypeSelected={this.selectFilterType}
              />
              <FormControl
                type={currentFilterType.filterType}
                value={currentValue}
                placeholder={currentFilterType.placeholder}
                onChange={e => this.updateCurrentValue(e)}
                onKeyPress={e => this.onValueKeyPress(e)}
              />
            </Filter>

            <Toolbar.RightContent>
              <CustomToolbarFind
                placeholder="Find By Keyword..."
                onChange={this.onFindAction}
                onEnter={this.onFindAction}
                onExit={this.onFindExit}
              />
            </Toolbar.RightContent>
            {activeFilters &&
              activeFilters.length > 0 && (
                <Toolbar.Results>
                  <h5>
                    {filteredRows.length}{' '}
                    {filteredRows.length === 1 ? 'Result' : 'Results'}
                  </h5>
                  <Filter.ActiveLabel>{'Active Filters'}:</Filter.ActiveLabel>
                  <Filter.List>
                    {activeFilters.map((item, index) => (
                      <Filter.Item
                        key={index}
                        onRemove={this.removeFilter}
                        filterData={item}
                      >
                        {item.label}
                      </Filter.Item>
                    ))}
                  </Filter.List>
                  <Button
                    bsStyle="link"
                    onClick={e => {
                      e.preventDefault();
                      this.clearFilters();
                    }}
                  >
                    {'Clear All Filters'}
                  </Button>
                </Toolbar.Results>
              )}
          </Toolbar>
        </Grid.Row>
        <br />
        <Table.PfProvider
          striped
          bordered
          hover
          dataTable
          columns={columns}
          components={{
            header: {
              cell: cellProps =>
                this.customHeaderFormatters({
                  cellProps,
                  columns,
                  sortingColumns,
                  rows: rows,
                  onSelectAllRows: this.onSelectAllRows
                })
            }
          }}
        >
          <Table.Header headerRows={resolve.headerRows({ columns })} />
          <Table.Body
            rows={rows || []}
            rowKey="id"
            onRow={this.onRow}
          />
        </Table.PfProvider>
        <PaginationRow
          viewType={PAGINATION_VIEW.TABLE}
          pagination={pagination}
          pageInputValue={pageChangeValue}
          amountOfPages={sortedPaginatedRows.amountOfPages}
          itemCount={sortedPaginatedRows.itemCount}
          itemsStart={sortedPaginatedRows.itemsStart}
          itemsEnd={sortedPaginatedRows.itemsEnd}
          onPerPageSelect={this.onPerPageSelect}
          onFirstPage={this.onFirstPage}
          onPreviousPage={this.onPreviousPage}
          onPageInput={this.onPageInput}
          onNextPage={this.onNextPage}
          onLastPage={this.onLastPage}
          onSubmit={this.onSubmit}
        />
        <br />
        {`${selectedRows.length} VMs selected.`}
      </React.Fragment>
    );
  }
}
export default PaginatedTableView;
