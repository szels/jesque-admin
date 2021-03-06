import React from "react";
import JesqueAdminClient from "../../tools/jesque-admin-client";
import BaseComponent from "../base-component";
import {map, assign} from "lodash";
import FromNow from "../common/from-now";
import FailureDetails from "./failure-details";
import Pager from "../common/pager";
const cx = require('classnames');
const navigate = require('react-mini-router').navigate;
const SweetAlert = require('react-swal');


export default class DelayedList extends BaseComponent {

  constructor(props) {
    super(props);
    this.client = new JesqueAdminClient();

    this.state = {
      list: null,
      loading: false,
      total: 0,
      max: 25,
      currentPage: props.page
    }
    this.bindThiz('doUpdate', 'getMaxPages', 'selectFailure', 'getSelectedView', 'onMaxChange', 'clearAll', 'changePage', 'resetToFirstPage', 'getClearAllAlert');
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
        this.doUpdate()
        this.startAutoUpdate()
      } else {
        this.stopAutoUpdate()
      }
    }
    this.changePage(props.page - 1)
  }

  startAutoUpdate() {
    this._interval = setInterval(this.doUpdate, 5000);
    this.props.changeAutoReload(true);
  }

  stopAutoUpdate() {
    this.props.changeAutoReload(false);
    if (this._interval) {
      clearInterval(this._interval)
    }
  }

  doUpdate() {
    if (!this.state.loading) {
      let {currentPage, max} = this.state;
      this.setState(assign(this.state, {loading: true}));
      this.client.get('delayed', null, {max: max, offset: (currentPage - 1) * max})
        .then((resp) => {
          if (resp.list.length === 0 && currentPage !== 1) {
            console.log("no items received and not on first page, returning to first page");
            this.setState(assign(this.state, {loading: false}));
            setTimeout(this.resetToFirstPage, 100)
          } else {
            this.setState(assign(this.state, {list: resp.list, total: resp.total, loading: false}))
          }
        }).catch((err)=> {
        this.stopAutoUpdate();
        window.setError(err);
        this.setState(assign(this.state, {loading: false}))
      })
    }
  }

  changePage(page) {
    page++;
    if (page < 1) {
      page = 1
    }
    if (page !== this.state.currentPage) {
      this.setState(assign(this.state, {currentPage: page}));
      setTimeout(()=> {
        this.doUpdate();
        navigate(`/jobs/delayed/${page}`, false);
      }, 100)
    } else {
      console.log("no actual page change detected, skipping")
    }
  }

  resetToFirstPage() {
    this.changePage(0)
  }

  getMaxPages() {
    let {total, max} = this.state;
    return Math.ceil(total / max)
  }

  selectFailure(failure) {
    this.setState(assign(this.state, {selected: failure}))
  }

  getTableBody(somethingSelected) {
    const {list, selected} = this.state;
    return map(list, (failure)=> {
      let cols = [];
      cols.push(<td key={`${failure.failedAt}-${failure.queue}-date`}><FromNow date={new Date(failure.failedAt)}/></td>);
      cols.push(<td key={`${failure.failedAt}-${failure.queue}-class`}>{failure.payload.className}</td>)
      cols.push(<td key={`${failure.failedAt}-${failure.queue}-throwable`}>{failure.throwableString}</td>)
      if (!somethingSelected) {
        cols.push(<td key={`${failure.failedAt}-${failure.queue}-error`}>{failure.error}</td>)
      }
      return (
        <tr className={cx('clickable', {info: selected === failure})} key={failure.failedAt} onClick={()=> {
          this.selectFailure(failure)
        }}>
          {cols}
        </tr>
      )
    })
  }

  onMaxChange(max) {
    if (this.state.max !== max) {
      this.setState(assign(this.state, {max: max}));
      let func;
      if (this.state.currentPage === 1) {
        func = this.doUpdate
      } else {
        func = this.resetToFirstPage
      }
      setTimeout(func, 100)
    }
  }

  render() {
    let somethingSelected = !!this.state.selected;
    let headers = [];
    headers.push(<th key="header-When">When</th>);
    headers.push(<th key="header-Job">Job</th>);
    headers.push(<th key="header-Exception">Exception</th>);
    if (!somethingSelected) {
      headers.push(<th key="header-Message">Message</th>);
    }
    return (
      <div className="delayed-list">
        <table className="table">
          <thead>
          <tr>
            {headers}
          </tr>
          </thead>
          <tbody>
          {this.getTableBody()}
          </tbody>
        </table>
        <Pager
          pages={this.getMaxPages()}
          current={this.state.currentPage}
          target={`/jobs/failed`}
          disabled={this.state.loading}
          onPageChange={this.changePage}
        />
      </div>
    )
  }

}
