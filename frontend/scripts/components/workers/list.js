import React from "react";
import BaseComponent from "../base-component";
import JesqueAdminClient from "../../tools/jesque-admin-client";
import {map, sortBy, find} from "lodash";
import Config from "../../tools/config";
import WorkerListRow from "./list-row";
import FilterButtonGroup from "../common/filter-button-group";
import WorkerDetails from "./details";
const cx = require("classnames");

const STATES = ["IDLE", "PAUSED", "WORKING"];

export default class WorkerList extends BaseComponent {

  constructor(props) {
    super(props);
    this.client = new JesqueAdminClient();

    this.state = {
      list: null,
      loading: false,
      total: 0,
      selected: null,
      max: 25,
      currentPage: props.page,
      confirmClearAll: false,
      status: Config.get('homeWorkerStatus'),
      query: ""
    };
    this.bindThiz('doUpdate', 'selectWorker', 'getSelectedView', 'getTableHeaders', 'getTableRows', 'onQueryChange', 'onStatusFilterChange', 'getDetailsView');
  }

  componentDidMount() {
    this.startAutoUpdate();
    this.doUpdate()
  }

  componentWillUnmount() {
    this.stopAutoUpdate()
  }

  componentWillReceiveProps(props) {
    if (props.autoReload != this.props.autoReload) {
      if (props.autoReload) {
        this.doUpdate();
        this.startAutoUpdate()
      } else {
        this.stopAutoUpdate()
      }
    }
  }

  startAutoUpdate() {
    this._interval = setInterval(this.doUpdate, 1000);
    this.props.changeAutoReload(true);
  }

  stopAutoUpdate() {
    this.props.changeAutoReload(false);
    if (this._interval) {
      clearInterval(this._interval)
    }
  }

  doUpdate() {
    const {loading, selected} = this.state;
    if (!loading) {
      this.client.get('workers')
        .then((resp)=> {
          let newSelected = null;
          if (selected) {
            const selectedKey = `${selected.host}-${selected.pid}`;
            newSelected = find(resp.list, (worker)=> {
              return `${worker.host}-${worker.pid}` === selectedKey;
            });
          }
          this.assignState({list: resp.list, selected: newSelected})
        })
        .catch(()=> {
          this.stopAutoUpdate()
        })
    }
  }

  doesWorkerMatchStatus(worker) {
    return this.state.status === null || worker.state === this.state.status
  }

  doesWorkerMatchQuery(worker) {
    if (this.state.query === "") {
      return true
    }
    let q = this.state.query.toLowerCase()
    let hostname = worker.host.toLowerCase()
    let pid = worker.pid.toLowerCase()
    return hostname.indexOf(q) > -1 || pid.indexOf(q) > -1
  }

  getTableHeaders() {
    let {selected} = this.state;
    let headers = [
      (<th key="table-header-host">Host</th>),
      (<th key="table-header-pid">Pid</th>),
      (<th key="table-header-state">State</th>),
    ];

    if (!selected) {
      headers.push(<th key="table-header-job">Job</th>);
      headers.push(<th key="table-header-since">Since</th>);
      headers.push(<th key="table-header-queues">Queues</th>);
    }

    return headers
  }

  onQueryChange(query) {
    this.assignState({query: query})
  }

  onStatusFilterChange(status) {
    let current = this.state.status;
    let newStatus;
    if (current === status) {
      newStatus = null
    } else {
      newStatus = status
    }
    Config.set('homeWorkerStatus', newStatus);
    this.assignState({status: newStatus})
  }

  getTableRows() {
    const {list, selected} = this.state;
    if (!list) {
      return <tr></tr>
    }
    let workers = sortBy(list, (w)=> {
      return w.state
    }).reverse();
    workers = sortBy(workers, (w)=> {
      const date = w.status ? new Date(w.status.runAt) : new Date();
      return date.getTime()
    });
    return map(workers, (worker)=> {
      if (this.doesWorkerMatchStatus(worker) && this.doesWorkerMatchQuery(worker)) {
        return <WorkerListRow
          key={`worker-row-${worker.host}-${worker.pid}`}
          worker={worker}
          selected={selected}
          selectable={this.props.selectable}
          onClick={(worker)=> {
            this.assignState({selected: worker})
          }}
        />
      }
    })
  }

  getDetailsView() {
    const {selected} = this.state;
    if (!selected) {
      return ""
    } else {
      return (
        <pre>{JSON.stringify(selected, 1, 1)}</pre>
      )
    }
  }

  render() {
    let {selected, query, status} = this.state;
    return (
      <div className="worker-list-container">
        <div className="page-header">
          <h3>Worker</h3>
        </div>
        <div className="filter-form">
          <div className="filter">
            <input className="form-control" placeholder="Search for host or pid" type="text" value={query} onChange={(e)=> {
              this.onQueryChange(e.target.value)
            }}/>
          </div>
          <div className="filter">
            <FilterButtonGroup onChange={this.onStatusFilterChange} current={status} filters={STATES}/>
          </div>
        </div>
        <div className="worker-list-content">
          <div className='list'>
            <table className="table table-striped table-hover">
              <thead>
              <tr>
                {this.getTableHeaders()}
              </tr>
              </thead>
              <tbody>
              {this.getTableRows()}
              </tbody>
            </table>
          </div>
          <div className={cx('details', {'visible': !!selected})}>
            <WorkerDetails worker={selected} onClose={()=>{
              this.assignState({selected: null})
            }}/>
          </div>
        </div>
      </div>
    )
  }

}
