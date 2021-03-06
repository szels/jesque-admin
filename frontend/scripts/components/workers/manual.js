import React from "react";
import BaseComponent from "../base-component";
import {assign, map, clone, each} from "lodash";
import JesqueAdminClient from "../../tools/jesque-admin-client";
const ReactSelect = require('react-select');
const cx = require('classnames');

const DEFAULT_STATE = {
  selectedJobs: null,
  queues: null,
  selectedQueue: null,
  loading: true,
  success: null,
  errorMessage: null
};

export default class WorkerManual extends BaseComponent {
  constructor(props) {
    super(props);

    this.client = new JesqueAdminClient();

    this.state = clone(DEFAULT_STATE);
    this.bindThiz('getQueues', 'jobSelected', 'queueSelected', 'reset', 'onFormSubmit', 'getAlert')
  }

  componentDidMount() {
    this.reset()
  }

  reset() {
    this.setState(clone(DEFAULT_STATE), this.getQueues);
  }

  getQueues() {
    this.setState(assign(this.state, {loading: true}));
    this.client.get('queues', null, {max: 500, offset: 0})
      .then((resp) => {
        let queues = [];
        resp.queues.forEach((queue)=> {
          if (queue.name !== 'JesqueDefaultQueue') {
            queues.push(queue.name)
          }
        });
        this.setState(assign(this.state, {queues: queues, loading: false}));
      }).catch((err)=> {
      window.setError(err);
    })
  }

  onFormSubmit(e) {
    e.preventDefault();
    this.setState(assign(this.state, {loading: true}));
    this.client.post('workers', null, {jobs: this.state.selectedJobs, queue: this.state.selectedQueue})
      .then((resp) => {
        if (resp.status === 'OK') {
          this.setState(assign(this.state, {loading: false, success: true}));
        } else {
          this.setState(assign(this.state, {loading: false, success: false, errorMessage: resp.message}));
        }
      }).catch(()=> {
      this.setState(assign(this.state, {loading: false, success: false}));
    })
  }

  buildReactSelectOptions(list) {
    return map(list, (l) => {
      return {value: l, label: l}
    })
  }

  jobSelected(jobs) {
    let jobsSelected = map(jobs, "value");
    this.setState(assign(this.state, {selectedJobs: jobsSelected}))
  }

  queueSelected(queue) {
    let selected = null;
    if (queue) {
      selected = queue.value;
    }
    this.setState(assign(this.state, {selectedQueue: selected}))
  }

  getAlert() {
    const success = this.state.success;
    if (success === null) {
      return ""
    }
    let text = this.state.errorMessage || "Worker could not be started!";
    if (success) {
      text = "Worker Started";
    }
    return (
      <div className={cx('alert', {"alert-success": success, "alert-danger": !success})}>{text}</div>
    )
  }

  render() {
    const jobs = this.props.jobs
    const {queues, selectedJobs, selectedQueue, loading} = this.state;
    return (
      <div className="job-manual">
        <div className="page-header">
          <h3>Start Worker Manually</h3>
        </div>
        {this.getAlert()}
        <form onSubmit={this.onFormSubmit} className={cx({disabled: loading})}>
          <div className="form-group">
            <label htmlFor="jobs">Job</label>
            <ReactSelect
              name="jobs"
              clearable={true}
              value={selectedJobs}
              options={this.buildReactSelectOptions(jobs)}
              onChange={this.jobSelected}
              disabled={loading}
              multi={true}
            />
          </div>
          <div className="form-group">
            <label htmlFor="queues">Queue</label>
            <ReactSelect
              name="queues"
              clearable={true}
              value={selectedQueue}
              disabled={!selectedJobs || loading}
              options={this.buildReactSelectOptions(queues)}
              onChange={this.queueSelected}/>
          </div>
          <div className="btn-group">
            <button type="reset" className="btn btn-danger" onClick={this.reset}>Reset</button>
            <button type="submit" className="btn btn-success">Start</button>
          </div>
        </form>
      </div>
    )
  }

}
