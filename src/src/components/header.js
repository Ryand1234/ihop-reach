// @flow

import React from "react"
import { Link, graphql, StaticQuery, navigate } from "gatsby"
import PropTypes from "prop-types"

import "font-awesome/css/font-awesome.min.css"

import style from "../assets/styles/header.module.scss"
class Header extends React.Component {
  constructor({ props }) {
    super(props)
    this.state = {
      showAdvOption: false,
      showSearchRes: false,
      searching: false,
      searchMsg: "",
    }
    this.searchInpBox = React.createRef()
  }
  searchKeyParser = (key) => {
    let keyArr = key
      .trim()
      .replace(/[~^*:]/g, "\\$&")
    return keyArr
  }
  searchController = event => {
    event.preventDefault()
    const searchKey = this.searchInpBox.current.value
    if (searchKey.length < 3) return null

    this.setState(
      {
        searchMsg: "Searching...",
        showSearchRes: true,
        searching: true,
      },
      () => {

        if (window.__LUNR__) {
          window.__LUNR__.__loaded.then(res => {
            let refs = []
            try {              
                refs = res.en.index.search(
                  this.searchKeyParser(searchKey)
                )
                if(refs.length == 0){
                  refs = res.en.index.query((q) => {
                      // exact matches should have the highest boost
                      q.term(searchKey, { boost: 100 })

                      // prefix matches should be boosted slightly
                      q.term(searchKey, { boost: 50, usePipeline: false, wildcard: 2 })
                      // wildcard 3 denotes prepend and append wildcard *
                      q.term(searchKey, { boost: 10, usePipeline: false, wildcard: 3 })

                      // finally, try a fuzzy search, without any boost
                      q.term(searchKey, { boost: 1, usePipeline: false, editDistance: 1 })
                  })
                }
            } catch (err) {
              this.setState({
                searchMsg: "Invalid Search",
                searching: false,
              })
              return
            }
            const pages = refs.map(({ ref }) => {
              return res.en.store[ref]
            })
            console.log(pages)
            switch (pages.length) {
              case 1:
                navigate("/details/" + pages[0].ide, {
                  state: {
                    searchTerm: searchKey,
                  },
                })
                this.setState({
                  showSearchRes: false,
                  searching: false,
                })
                break
              case 0:
                this.setState({
                  searchMsg: "No Results Found",
                  searching: false,
                })
                break
              //No results

              default:
                //Array of results
                navigate("/search", {
                  state: {
                    searchTerm: searchKey,
                    results: pages,
                  }
                })
                this.setState({
                  showSearchRes: false,
                  searching: false,             
                })
                break
            }
          })
        }
      }
    )
  }
  advOption = () => {
    if (this.state.showAdvOption)
      return (
        <div className={style.advOptDiv}>
          <nav className="navbar py-2 bg-light">
            <div className="container">
              <div className="row">
                <div className="col-sm-4 py-1">Advanced Options</div>
                {/* Section for Field filter */}
                <div className="col">
                  <select
                    className="custom-select custom-select-sm"
                    name="field"
                    id="field"
                    defaultValue="all"
                  >
                    <option value="all" disabled hidden>
                      Specify fields
                    </option>
                    <option value="synonym">synonyms</option>
                    <option value="dbref">any accession number</option>
                    <option value="NCBI_LOCUSLINK__ID">NCBI Gene</option>
                    <option value="UNIPROT__AC">UniProt</option>
                    <option value="Google">Google</option>
                  </select>
                </div>
                {/* Section for organism filter */}
                <div className="col">
                  <select
                    className="custom-select custom-select-sm"
                    name="ncbi_tax_id"
                    id="ncbi_tax_id"
                    defaultValue="all"
                  >
                    <option value="all" disabled hidden>
                      Specify organism...
                    </option>
                    <optgroup>
                      <option value="9606">Homo sapiens</option>
                      <option value="9598">Pan troglodytes</option>
                      <option value="9544">Macaca mulatta</option>
                      <option value="9615">Canis familiaris</option>
                      <option value="9913">Bos taurus</option>
                      <option value="10090">Mus musculus</option>
                      <option value="10116">Rattus norvegicus</option>
                    </optgroup>
                    <optgroup>
                      <option value="9031">Gallus gallus</option>
                      <option value="8364">Xenopus tropicalis</option>
                      <option value="7955">Danio rerio</option>
                      <option value="31033">Takifugu rubripes</option>
                    </optgroup>
                    <optgroup>
                      <option value="3702">Arabidopsis thaliana</option>
                      <option value="4530">Oryza sativa</option>
                    </optgroup>
                    <optgroup>
                      <option value="7227">Drosophila melanogaster</option>
                      <option value="7165">Anopheles gambiae</option>
                      <option value="6239">Caenorhabditis elegans</option>
                    </optgroup>
                    <optgroup>
                      <option value="4932">Saccharomyces cerevisiae</option>
                      <option value="4896">Schizosaccharomyces pombe</option>
                      <option value="562">Escherichia coli</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )
  }
  advOptionController = () => {
    this.setState(state => ({
      showAdvOption: !state.showAdvOption,
    }))
  }
  searchInpBoxController = () => {
    this.setState({
      showSearchRes: false,
    })
  }
  render() {
    const data = this.props.data
    let searchedTerm
    try {
      searchedTerm = window.history.state.searchTerm
    } catch (e) {
      searchedTerm = null
    }
    return (
      <header>
        <nav className={["navbar navbar-expand-lg bg-light"].join()}>
          <Link
            className={["navbar-brand mx-sm-5", style.brand].join(" ")}
            to="/"
            className="col-sm-1 col-12 text-center"
          >
            {/* <img className={style.logoImg} src={logo} alt="iHOP-Reach" /> */}
            <h5 className="mx-auto"><b>{data.site.siteMetadata.title}</b></h5>
          </Link>
          <form
            className="form-inline my-0 col-sm-6 pr-0"
            onSubmit={this.searchController}
          >
            <div className="my-1 col px-0">
              <div className={"input-group " + style.searchBox}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  aria-label="Search"
                  aria-describedby="searchBtn"
                  id="searchInpBox"
                  defaultValue={searchedTerm}
                  ref={this.searchInpBox}
                  onChange={this.searchInpBoxController}
                />
                <div className="input-group-append">
                  <button
                    disabled={this.state.searching}
                    className="input-group-text"
                    id="searchBtn"
                  >
                    {this.state.searching == true ? (
                      <i className="fa fa-circle-o-notch fa-spin" />
                    ) : (
                      <i className="fa fa-search" />
                    )}
                  </button>
                </div>
              </div>
              {this.state.showSearchRes == true ? (
                <div
                  className={["px-0 container", style.noResultsBlock].join(" ")}
                >
                  <div className="col py-2">{this.state.searchMsg}</div>
                </div>
              ) : null}
              {/* Advanced option button */}
              <small
                className={[style.advOptLink, "row"].join(" ")}
              >
                <span
                  className={["col", "nav-text", style.egText].join(" ")}
                >
                  e.g. SNF1, Taxonomy:9606, UniProt:Q12794
                </span>
                {/* <span
                  className={["col-sm-4", "nav-link", style.advText].join(" ")}
                  onClick={this.advOptionController}
                >
                  Advanced Options
                  {this.state.showAdvOption == true ? (
                    <i className="fa fa-times" />
                  ) : (
                    <i className="fa fa-caret-down" />
                  )}
                </span> */}
              </small>
            </div>
          </form>
        </nav>
        <div>
          {// Advanced option
          this.advOption()}
        </div>
      </header>
    )
  }
}

export default props => (
  <StaticQuery
    query={graphql`
      query {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => <Header data={data} {...props} />}
  />
)

Header.propTypes = {
  data: PropTypes.shape({
    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        title: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
}
