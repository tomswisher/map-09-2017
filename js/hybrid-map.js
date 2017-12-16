// tomswisherlabs@gmail.com     https://github.com/tomswisher

'use strict'; /* globals d3, console, nodes, count */ /* jshint -W069, unused:false */

// Performance -------------------------------------------------------------------------------------

var logsTest = 'in',
    logsLvl1 = false,
    logsLvl2 = false;
var resizeWait = 150,
    resizeCounter = 0;
var stackLevel = 0,
    stackLevelTemp = 0;
var sizeNodesOld = -1,
    sizeUsedOld = -1,
    sizeTotalOld = -1;
var sizeNodesNew = 0,
    sizeUsedNew = 0,
    sizeTotalNew = 0;
var colorSource = '',
    colorNodes = '',
    colorUsed = '',
    colorTotal = '';
var stringSource = '',
    stringNodes = '',
    stringUsed = '',
    stringTotal = '',
    stringCombined = '',
    stringSymbol = '';
var mobileUserAgents = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
    mobileBrowser = navigator && mobileUserAgents.test(navigator.userAgent);
if (mobileBrowser) console.log('mobileBrowser', mobileBrowser);
var isLoaded = false;

// D3 Selections -----------------------------------------------------------------------------------

var body = d3.select('body');
var svg = body.select('#svg');
var svgDefs = body.select('#svg-defs');
var svgDefsArrowheads = svgDefs.selectAll('marker.arrowhead');
var bgRect = body.select('#bg-rect');
var clipPathRect = body.select('#clip-path-rect');
var statesG = body.select('#states-g');
var statePaths = statesG.select(null);
var nodesG = body.select('#nodes-g');
var nodeCircles = nodesG.select(null);
var linksG = body.select('#links-g');
var linkLines = linksG.select(null);
var filtersDiv = body.select('#filters-div');
var filtersYears = filtersDiv.select(null);
var filtersReports = filtersDiv.select(null);
var optionsDiv = body.select('#options-div');
var optionGroups = optionsDiv.select(null);
var optionRows = optionGroups.select(null);
var optionsAlphaLabel = optionsDiv.select(null);
var optionsAlphaSlider = optionsDiv.select(null);
var infoG = body.select('#info-g');
var infoImageGs = infoG.select(null);
var infoTextGs = infoG.select(null);

// Visual Styling ----------------------------------------------------------------------------------

var vs = {
    svg: {
        w: null,
        h: null
    },
    map: {
        w: null,
        wMin: 300,
        h: null,
        ratioMapWH: 1.6,
        projectionScale: 1.2,
        selectedOpacity: 0.3,
        strokeWidthStates: 1
    },
    network: {
        rMin: 4,
        rFactor: 60,
        strokeWidth: 1
    },
    info: {
        w: 0.5 * 396,
        h: null,
        wImage: null,
        hImage: null,
        ratioImageWH: 0.5 * 396 / (0.5 * 432),
        margin: 5,
        textRowH: 15
    },
    filters: {
        w: null,
        h: 70
    },
    options: {
        wSmall: 50,
        wMedium: 90,
        wSlider: 130,
        wRow: null,
        hRow: 20
    },
    test: {
        colorNeutral: 'black',
        colorBad: 'firebrick',
        colorGood: 'green'
    }
};
vs.info.wImage = vs.info.w - 2 * vs.info.margin;
vs.info.hImage = vs.info.wImage / vs.info.ratioImageWH;
vs.info.h = vs.info.hImage + 4 * vs.info.textRowH + 3 * vs.info.margin;
vs.options.wRow = 2 * vs.options.wSmall + 2 * vs.options.wMedium + vs.options.wSlider;

// Global Variables --------------------------------------------------------------------------------

var transitionDuration = 200;
var transitionEase = d3.easeLinear;
var topIds = ['Alice Walton', 'Carrie Walton Penner', 'Jim Walton', 'Dorris Fisher', 'Eli Broad', 'Greg Penner', 'Jonathan Sackler', 'Laurene Powell Jobs', 'Michael Bloomberg', 'Reed Hastings', 'Stacy Schusterman', 'John Arnold', 'Laura Arnold'];
var mapObj = null;
var isDragging = false;
var yearsData = ['2011', '2012', '2013', '2014', '2015', '2016', '2017'];
var reportsData = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Window Events -----------------------------------------------------------------------------------

window.onload = function () {
    d3.queue().defer(d3.json, 'data/us-states-features.json').defer(d3.json, 'data/nodes-links-04-06-2017.json').awaitAll(InitializePage);
};
window.onresize = function () {
    if (!isLoaded) {
        return;
    }
    if (logsLvl1) console.log(''.padStart(resizeCounter * 2, ' ') + resizeCounter);
    resizeCounter += 1;
    setTimeout(function () {
        if (resizeCounter > 1) {
            resizeCounter -= 1;
            if (logsLvl1) console.log(''.padStart(resizeCounter * 2, ' ') + resizeCounter);
        } else if (resizeCounter === 1) {
            resizeCounter -= 1;
            if (logsLvl1) console.log(''.padStart(resizeCounter * 2, ' ') + resizeCounter);
            UpdateVSValues();
            mapObj.DrawMap().DrawNetwork().DrawInfo().DrawFilters().UpdateSimulation().DrawOptions();
        }
    }, resizeWait);
};

// Functions ---------------------------------------------------------------------------------------

function UpdateVSValues() {
    TestApp('UpdateVSValues', 1);
    var clientWidth = body.node().clientWidth;
    if (clientWidth >= vs.map.wMin + vs.info.w) {
        vs.map.w = clientWidth - vs.info.w;
        vs.svg.w = clientWidth;
    } else {
        vs.map.w = vs.map.wMin;
        vs.svg.w = vs.map.wMin + vs.info.w;
    }
    vs.filters.w = vs.map.w;
    vs.map.h = vs.map.w / vs.map.ratioMapWH;
    vs.svg.h = Math.max(vs.map.h, vs.info.h);
    TestApp('UpdateVSValues', -1);
}

var InitializePage = function InitializePage(error, results) {
    TestApp('InitializePage', 1);
    UpdateVSValues();
    mapObj = new HybridMapClass().LoadStates(results[0].features).DrawMap().LoadNodes(results[1].nodes).LoadLinks(results[1].links).CalculateData().DrawNetwork().DrawInfo().UpdateSimulation().DrawOptions();
    requestAnimationFrame(function () {
        body.classed('loading', false);
        isLoaded = true;
    });
    TestApp('InitializePage', -1);
};

function HybridMapClass() {
    TestApp('HybridMapClass', 1);
    var that = this;
    that.filteredOutObj = {
        year: {},
        report: {}
    };
    that.states = [];
    that.nodes = [];
    that.links = [];
    that.statesLoaded = [];
    that.nodesLoaded = [];
    that.linksLoaded = [];
    that.nodeSelected = null;
    that.linksSelected = [];
    that.infoData = [];
    that.centroidByState = {};
    that.$total = 0;
    that.$inByState = {};
    that.$outByState = {};
    that.$inById = {};
    that.$outById = {};
    that.$nodeScale = d3.scaleLinear().range([0, 1]);
    that.nodeById = {};
    that.projection = d3.geoAlbersUsa();
    that.path = d3.geoPath();

    that.LoadStates = function (d) {
        TestApp('UpdateStates', 1);
        that.statesLoaded = d;
        that.states = that.statesLoaded;
        that.filteredOutObj = {
            year: {},
            report: {}
        };
        that.DrawFilters();
        TestApp('UpdateStates', -1);
        return that;
    };

    that.LoadNodes = function (d) {
        TestApp('LoadNodes', 1);
        that.nodesLoaded = d;
        that.filteredOutObj = {
            year: {},
            report: {}
        };
        that.DrawFilters();
        TestApp('LoadNodes', -1);
        return that;
    };

    that.LoadLinks = function (d) {
        TestApp('LoadLinks', 1);
        that.linksLoaded = d;
        that.$total = 0;
        that.linksLoaded.forEach(function (d) {
            d.sourceId = d.source;
            d.targetId = d.target;
            that.$total += d.dollars;
        });
        that.$nodeScale.domain([0, that.$total]);
        that.filteredOutObj = {
            year: {},
            report: {}
        };
        that.DrawFilters();
        TestApp('LoadLinks', -1);
        return that;
    };

    that.CalculateData = function () {
        TestApp('CalculateData', 1);
        that.states = that.statesLoaded;
        var iCount = 0;
        that.nodes = that.nodesLoaded;
        that.nodes.forEach(function (d, i) {
            that.$outById[d.id] = 0;
            that.$inById[d.id] = 0;
            that.$outByState[d.state] = 0;
            that.$inByState[d.state] = 0;
            if (topIds.includes(d.id)) {
                d.i = iCount;
                iCount += 1;
            }
            d.x = d.x === undefined ? that.centroidByState[d.state][0] : d.x;
            d.y = d.y === undefined ? that.centroidByState[d.state][1] : d.y;
        });
        that.nodeById = d3.map(that.nodes, function (d) {
            return d.id;
        });
        that.links = that.linksLoaded.filter(function (d) {
            if (that.filteredOutObj.year[d.year]) {
                return false;
            }
            if (that.filteredOutObj.report[d.report]) {
                return false;
            }
            return true;
        });
        that.links.forEach(function (d) {
            d.source = that.nodeById.get(d.sourceId);
            d.target = that.nodeById.get(d.targetId);
            that.$outById[d.source.id] += d.dollars;
            that.$inById[d.target.id] += d.dollars;
            that.$outByState[d.source.state] += d.dollars;
            that.$inByState[d.target.state] += d.dollars;
        });
        that.nodes.forEach(function (d) {
            var $in = that.$nodeScale(that.$inById[d.id]);
            var $out = that.$nodeScale(that.$outById[d.id]);
            if ($in === 0 && $out === 0) {
                d.r = 0;
            } else if ($in > $out) {
                d.r = Math.max(vs.network.rMin, vs.network.rFactor * Math.sqrt($in));
            } else {
                d.r = Math.max(vs.network.rMin, vs.network.rFactor * Math.sqrt($out));
            }
        });
        TestApp('CalculateData', -1);
        return that;
    };

    that.DrawMap = function () {
        TestApp('DrawMap', 1);
        svg.attr('width', vs.svg.w).attr('height', vs.svg.h);
        bgRect.attr('width', vs.map.w).attr('height', vs.map.h);
        clipPathRect.attr('width', vs.map.w).attr('height', vs.svg.h);
        that.projection.scale(vs.map.w * vs.map.projectionScale).translate([vs.map.w / 2, vs.map.h / 2]);
        that.path.projection(that.projection);
        statePaths = statesG.selectAll('path.state-path').data(that.states, function (d) {
            return d.properties.ansi;
        });
        statePaths = statePaths.enter().append('path').classed('state-path', true).classed('inactive', true).merge(statePaths);
        statePaths.attr('d', that.path).each(function (d) {
            return that.centroidByState[d.properties.ansi] = that.path.centroid(d);
        }).style('stroke-width', vs.map.strokeWidthStates + 'px');
        // statePaths.each(d => {
        //     let centroid = that.centroidByState[d.properties.ansi];
        //     console.log(d.properties.ansi, centroid);
        //     let rect = d3.select(this.parentNode).append('rect')
        //         .attr('x', centroid[0]-20)
        //         .attr('y', centroid[1]-20)
        //         .attr('width', 40)
        //         .attr('height', 40)
        //         .attr('fill', 'white')
        //         .style('stroke', 'red');
        //     d3.select(this).remove();
        // });
        TestApp('DrawMap', -1);
        return that;
    };

    that.DrawInfo = function () {
        TestApp('DrawInfo', 1);
        infoG.attr('transform', 'translate(' + (vs.map.w + vs.info.margin) + ',' + vs.info.margin + ')');
        infoImageGs = infoG.selectAll('g.info-image-g').data(that.infoData);
        infoImageGs = infoImageGs.enter().append('g').classed('info-image-g', true).each(function (datum) {
            d3.select(this).append('image').attr('width', vs.info.wImage).attr('height', vs.info.hImage).attr('xlink:href', function () {
                if (!topIds.includes(datum.id)) {
                    return null;
                } else {
                    return 'img/' + datum.id + '.jpg';
                }
            });
        }).merge(infoImageGs);
        infoImageGs.transition().duration(transitionDuration).ease(transitionEase).style('opacity', function (d) {
            return +(that.nodeSelected && d.id === that.nodeSelected.id);
        });
        infoTextGs = infoG.selectAll('g.info-text-g').data(that.infoData);
        infoTextGs = infoTextGs.enter().append('g').classed('info-text-g', true).attr('transform', 'translate(' + vs.info.wImage / 2 + ',' + (vs.info.hImage + vs.info.margin) + ')').style('opacity', 0).merge(infoTextGs);
        infoTextGs.selectAll('text').remove();
        infoTextGs.each(function (datum) {
            d3.select(this).append('text').attr('x', 0).attr('y', 0.5 * vs.info.textRowH).text(datum.id);
            d3.select(this).append('text').attr('x', 0).attr('y', 1.5 * vs.info.textRowH).text('State: ' + datum.state);
            // if (that.$inById[datum.id] > 0) {
            d3.select(this).append('text').attr('x', 0).attr('y', 2.5 * vs.info.textRowH).text('Received: ' + d3.format('$,')(that.$inById[datum.id]));
            // }
            // if (that.$outById[datum.id] > 0) {
            d3.select(this).append('text').attr('x', 0).attr('y', 3.5 * vs.info.textRowH).text('Donated: ' + d3.format('$,')(that.$outById[datum.id]));
            // }
            // d3.select(this).append('text')
            //     .attr('x', 0)
            //     .attr('y', 4.5 * vs.info.textRowH)
            //     .text(() => {
            //         let yearsArray = yearsData.filter(d => !(that.filteredOutObj.year[d]));
            //         if (yearsArray.length === 0) {
            //             return 'Years: None';
            //         } else {
            //             return 'Years: [' + yearsArray + ']';
            //         }
            //     });
        }).transition().duration(transitionDuration).ease(transitionEase).style('opacity', function (d) {
            return +(that.nodeSelected && d.id === that.nodeSelected.id);
        });
        TestApp('DrawInfo', -1);
        return that;
    };

    that.optionsDataMaster = [{
        category: 'forceCenter',
        isEnabled: false,
        rows: [{
            name: 'x',
            value: 'cx'
        }, {
            name: 'y',
            value: 'cy'
        }]
    }, {
        category: 'forceCollide',
        isEnabled: true,
        rows: [{
            name: 'iterations',
            value: 10,
            min: 0,
            max: 10,
            step: 1,
            _default: 1
        }, {
            name: 'strength',
            value: 1,
            min: 0,
            max: 1,
            step: 0.01,
            _default: 1
        }, {
            name: 'radius',
            value: function value(node, i, nodes) {
                return node.r ? 1.5 + node.r : 0;
            }
        }]
    }, {
        category: 'forceLink',
        isEnabled: false,
        rows: [{
            name: 'links',
            value: [],
            _default: []
        }, {
            name: 'id',
            value: function value(node) {
                return node.index;
            }

        }, {
            name: 'iterations',
            value: 1,
            min: 0,
            max: 10,
            step: 1,
            _default: 1
        }, {
            name: 'strength',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
            _default: function _default(link, i, links) {
                return 1 / Math.min(count[link.source.index], count[link.target.index]);
            }
        }, {
            name: 'distance',
            value: 30,
            min: 0,
            max: 100,
            step: 1,
            _default: function _default(link, i, links) {
                return 30;
            }
        }]
    }, {
        category: 'forceManyBody',
        isEnabled: false,
        isIsolated: true,
        rows: [{
            name: 'strength',
            value: -30,
            min: -100,
            max: 0,
            step: 1,
            _default: function _default(node, i, nodes) {
                return -30;
            }
        }, {
            name: 'distanceMin',
            value: 1,
            min: 0,
            max: 10000,
            step: 1
        }, {
            name: 'distanceMax',
            value: 100,
            min: 0,
            max: 200,
            step: 1,
            _default: Infinity
        }, {
            name: 'theta',
            value: 0.81,
            min: 0,
            max: 1,
            step: 0.1
        }]
    }, {
        category: 'forceRadial',
        isEnabled: false,
        rows: [{
            name: 'strength',
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.01,
            _default: function _default(node, i, nodes) {
                return 0.1;
            }
        }, {
            name: 'radius',
            value: function value(node, i, nodes) {
                return node.r;
            }
        }, {
            name: 'x',
            value: 'cx'
        }, {
            name: 'y',
            value: 'cy'
        }]
    }, {
        category: 'forceX',
        isEnabled: true,
        isIsolated: true,
        rows: [{
            name: 'strength',
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.05,
            _default: function _default(node, i, nodes) {
                return 0.1;
            }
        }, {
            name: 'x',
            value: 'cx',
            _default: function _default(node, i, nodes) {
                return node.x;
            }
        }]
    }, {
        category: 'forceY',
        isEnabled: true,
        isIsolated: true,
        rows: [{
            name: 'strength',
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.05,
            _default: function _default(node, i, nodes) {
                return 0.1;
            }
        }, {
            name: 'y',
            value: 'cy',
            _default: function _default(node, i, nodes) {
                return node.y;
            }
        }]
    }, {
        category: 'simulation',
        isEnabled: true,
        rows: [{
            name: 'alpha',
            value: 1,
            min: 0,
            max: 1,
            step: 0.01
        }, {
            name: 'alphaMin',
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.05,
            _default: 0.001
        }, {
            name: 'alphaDecay',
            value: 0.02276277904418933,
            min: 0.01,
            max: 0.2,
            step: 0.01
        }, {
            name: 'alphaTarget',
            value: 0,
            min: 0,
            max: 0.19,
            step: 0.01
        }, {
            name: 'velocityDecay',
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.1
        }]
    }];
    that.optionDatumAlpha = that.optionsDataMaster[that.optionsDataMaster.length - 1];

    that.UpdateSimulation = function () {
        TestApp('UpdateSimulation', 1);
        that.simulation = d3.forceSimulation().nodes(that.nodes).on('tick', that.Tick).stop();
        that.optionsData = that.optionsDataMaster.filter(function (d) {
            return d.isEnabled;
        });
        that.optionsData.forEach(function (optionsObj) {
            if (optionsObj.category === 'simulation') {
                optionsObj.rows.forEach(function (row) {
                    that.simulation[row.name](row.value);
                });
            } else if (optionsObj.isIsolated === true) {
                Object.keys(that.$outByState).forEach(function (state) {
                    var cx = that.centroidByState[state][0];
                    var cy = that.centroidByState[state][1];
                    var forceNew = d3[optionsObj.category]();
                    var initialize = forceNew.initialize;
                    forceNew.initialize = function () {
                        initialize.call(forceNew, that.nodes.filter(function (d) {
                            return d.state === state;
                        }));
                    };
                    optionsObj.rows.forEach(function (row) {
                        var rowValue = row.value; // do not mutate original
                        switch (rowValue) {
                            case 'cx':
                                rowValue = cx;
                                break;
                            case 'cy':
                                rowValue = cy;
                                break;
                        }
                        forceNew[row.name](rowValue);
                    });
                    that.simulation.force(optionsObj.category + state, forceNew).stop();
                });
            } else {
                var forceNew = d3[optionsObj.category]();
                optionsObj.rows.forEach(function (row) {
                    var rowValue = row.value; // do not mutate original
                    switch (rowValue) {
                        case 'cx':
                            rowValue = 0.5 * vs.map.w;
                            break;
                        case 'cy':
                            rowValue = 0.5 * vs.map.h;
                            break;
                    }
                    forceNew[row.name](rowValue);
                });
                that.simulation.force(optionsObj.category, forceNew).stop();
            }
        });
        that.simulation.stop().alpha(1).restart();
        TestApp('UpdateSimulation', -1);
        return that;
    };

    that.DragStarted = function (d) {
        // TestApp('DragStarted', 1);
        isDragging = true;
        // if (!d3.event.active) { that.simulation.alphaTarget(0.3).restart(); }
        d.fx = d.x;
        d.fy = d.y;
        // that.Tick();
        // TestApp('DragStarted', -1);
    };

    that.Dragged = function (d) {
        // TestApp('Dragged', 1);
        d.fx = d3.event.x;
        d.fy = d3.event.y;
        d.x = d3.event.x;
        d.y = d3.event.y;
        d.cx = d3.event.x;
        d.cy = d3.event.y;
        that.Tick();
        // TestApp('Dragged', -1);
    };

    that.DragEnded = function (d) {
        // TestApp('DragEnded', 1);
        isDragging = false;
        // if (!d3.event.active) { that.simulation.alphaTarget(0); }
        d.fx = null;
        d.fy = null;
        if (!d3.event.active) {
            that.simulation.alpha(1).restart();
        }
        // TestApp('DragEnded', -1);
    };

    that.DrawNetwork = function () {
        TestApp('DrawNetwork', 1);
        nodeCircles = nodesG.selectAll('circle.node-circle').data(that.nodes);
        nodeCircles = nodeCircles.enter().append('circle').classed('node-circle', true).on('mouseover', function (d) {
            if (isDragging) {
                return;
            }
            that.nodeSelected = d;
            that.linksSelected = that.links.filter(function (d) {
                return that.nodeSelected.id === d.source.id || that.nodeSelected.id === d.target.id;
            });
            if (!that.infoData.includes(that.nodeSelected)) {
                that.infoData.push(that.nodeSelected);
            }
            that.DrawNetwork().DrawInfo();
        }).on('mouseout', function () {
            if (isDragging) {
                return;
            }
            that.nodeSelected = null;
            that.linksSelected = [];
            that.DrawNetwork().DrawInfo();
        }).call(d3.drag().on('start', that.DragStarted).on('drag', that.Dragged).on('end', that.DragEnded)).merge(nodeCircles);
        nodeCircles.attr('cx', function (d) {
            return d.x;
        }).attr('cy', function (d) {
            return d.y;
        }).style('stroke-width', vs.network.strokeWidth + 'px').style('fill', function (d) {
            if (topIds.includes(d.id)) {
                return d3.schemeCategory20[d.i];
            } else if (d.$out > 0) {
                return 'gainsboro';
            } else {
                return 'white';
            }
        }).style('stroke', 'gray').attr('r', function (d) {
            return d.r;
        })
        // .transition().duration(transitionDuration).ease(transitionEase)
        .style('opacity', function (d) {
            if (!that.nodeSelected) {
                return 1;
            } else if (that.nodeSelected.id === d.id) {
                return 1;
            } else if (that.linksSelected.map(function (d) {
                return d.source.id;
            }).includes(d.id)) {
                return 1;
            } else if (that.linksSelected.map(function (d) {
                return d.target.id;
            }).includes(d.id)) {
                return 1;
            } else {
                return 0.05;
            }
        });
        svgDefsArrowheads = svgDefs.selectAll('marker.arrowhead').data(topIds.concat('misc'));
        svgDefsArrowheads = svgDefsArrowheads.enter().append('marker').classed('arrowhead', true).attr('id', function (d, i) {
            return 'arrowhead-id' + i;
        }).each(function (datum, i) {
            d3.select(this).selectAll('path').data([null]).enter().append('path').attr('d', 'M 0 0 12 6 0 12 3 6 Z').style('stroke', function () {
                return i < topIds.length ? d3.schemeCategory20[i] : 'gray';
            }).style('fill', function () {
                return i < topIds.length ? d3.schemeCategory20[i] : 'gainsboro';
            });
        }).merge(svgDefsArrowheads);
        svgDefsArrowheads.attr('refX', 12).attr('refY', 6).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 112).attr('markerHeight', 118).attr('orient', 'auto');
        linkLines = linksG.selectAll('line.link-line').data(that.links);
        linkLines.exit().remove();
        linkLines = linkLines.enter().append('line').classed('link-line', true).attr('x1', function (d) {
            return d.source.x;
        }).attr('y1', function (d) {
            return d.source.y;
        }).attr('x2', function (d) {
            return d.target.x;
        }).attr('y2', function (d) {
            return d.target.y;
        }).merge(linkLines);
        linkLines.attr('marker-end', function (d) {
            if (topIds.includes(d.source.id)) {
                return 'url(#arrowhead-id' + d.source.i + ')';
            } else {
                return 'url(#arrowhead-id' + topIds.length + ')';
            }
        }).style('stroke-width', vs.network.strokeWidth + 'px').style('stroke', function (d) {
            if (topIds.includes(d.source.id)) {
                return d3.schemeCategory20[d.source.i];
            } else if (topIds.includes(d.target.id)) {
                return d3.schemeCategory20[d.target.i];
            } else if (d.source.$out > 0) {
                return 'gray';
            } else if (d.target.$out > 0) {
                return 'gray';
            } else {
                return 'gainsboro';
            }
        })
        // .transition().duration(transitionDuration).ease(transitionEase)
        .style('display', function (d) {
            if (that.filteredOutObj.year[d.year]) {
                return 'none';
            } else if (that.filteredOutObj.report[d.report]) {
                return 'none';
            } else if (!that.nodeSelected) {
                return 'block';
            } else if (that.nodeSelected.id === d.source.id) {
                return 'block';
            } else if (that.nodeSelected.id === d.target.id) {
                return 'block';
            } else {
                return 'none';
            }
        });
        TestApp('DrawNetwork', -1);
        return that;
    };

    that.DrawFilters = function () {
        TestApp('DrawFilters', 1);
        filtersDiv.style('width', vs.filters.w + 'px').style('height', vs.filters.h + 'px').style('left', '0px').style('top', vs.map.h + 'px');
        filtersYears = filtersDiv.selectAll('div.filters-year').data(yearsData);
        filtersYears = filtersYears.enter().append('div').classed('filters-year', true).each(function (datum) {
            d3.select(this).append('div').text(datum);
            d3.select(this).append('input').attr('type', 'checkbox').each(function (d) {
                this.checked = true;
            }).on('change', function (d) {
                that.filteredOutObj.year[d] = !this.checked;
                that.CalculateData().DrawNetwork().UpdateSimulation();
            });
        }).merge(filtersYears).style('width', vs.filters.w / yearsData.length + 'px').style('height', 0.5 * vs.filters.h + 'px');
        filtersReports = filtersDiv.selectAll('div.filters-report').data(reportsData);
        filtersReports = filtersReports.enter().append('div').classed('filters-report', true).each(function (datum) {
            d3.select(this).append('div').text(datum);
            d3.select(this).append('input').attr('type', 'checkbox').each(function (d) {
                this.checked = true;
            }).on('change', function (d) {
                that.filteredOutObj.report[d] = !this.checked;
                that.CalculateData().DrawNetwork().UpdateSimulation();
            });
        }).merge(filtersReports).style('width', vs.filters.w / reportsData.length + 'px').style('height', 0.5 * vs.filters.h + 'px');
        TestApp('DrawFilters', -1);
        return that;
    };

    that.DrawOptions = function () {
        TestApp('DrawOptions', 1);
        optionsDiv.style('left', '0px').style('top', Math.max(vs.svg.h, vs.map.h + vs.filters.h) + 'px');
        optionGroups = optionsDiv.selectAll('div.option-group').data(that.optionsData);
        optionGroups = optionGroups.enter().append('div').classed('option-group', true).each(function (datum) {
            d3.select(this).append('div').classed('option-category', true).append('label').classed('label-medium', true).text(datum.category);
        }).merge(optionGroups).style('width', vs.options.wRow + vs.options.wMedium + 'px');
        optionRows = optionGroups.selectAll('div.option-row').data(function (d) {
            return d.rows;
        });
        optionRows = optionRows.enter().append('div').classed('option-row', true).each(function (datum) {
            d3.select(this).append('label').classed('label-medium', true).text(datum.name);
            d3.select(this).append('label').classed('label-medium', true).classed('option-value', true);
            if (datum.min !== undefined) {
                d3.select(this).append('label').classed('label-small', true).text(datum.min);
            }
            if (datum.step !== undefined) {
                d3.select(this).append('input').attr('type', 'range').attr('min', datum.min).attr('max', datum.max).attr('step', datum.step).attr('value', datum.value).on('change', function () {
                    if (datum.step === parseInt(datum.step)) {
                        datum.value = parseInt(this.value);
                    } else {
                        datum.value = parseFloat(this.value);
                    }
                    that.UpdateSimulation().DrawOptions();
                });
            }
            if (datum.max !== undefined) {
                d3.select(this).append('label').classed('label-small', true).text(datum.max);
            }
            if (datum.name === 'alpha') {
                optionsAlphaLabel = d3.select(this).selectAll('label.option-value');
                optionsAlphaSlider = d3.select(this).selectAll('input[type="range"]');
            }
        }).merge(optionRows).each(function (datum) {
            d3.select(this).selectAll('label.option-value').text(function () {
                return typeof datum.value === 'function' ? 'function' : datum.value;
            });
            d3.select(this).selectAll('label.label-small').style('width', vs.options.wSmall + 'px');
            d3.select(this).selectAll('label.label-medium').style('width', vs.options.wMedium + 'px');
            d3.select(this).selectAll('input[type=\'Range\']').style('width', vs.options.wSlider + 'px');
            d3.select(this).selectAll('*').style('height', vs.options.hRow + 'px').style('line-height', vs.options.hRow + 'px');
        }).style('width', vs.options.wRow + 'px');
        optionGroups.selectAll('label.label-small').style('width', vs.options.wSmall + 'px');
        optionGroups.selectAll('label.label-medium').style('width', vs.options.wMedium + 'px');
        optionGroups.selectAll('input[type=\'Range\']').style('width', vs.options.wSlider + 'px');
        optionGroups.selectAll('*').style('height', vs.options.hRow + 'px').style('line-height', vs.options.hRow + 'px');
        TestApp('DrawOptions', -1);
        return that;
    };

    that.Tick = function () {
        // TestApp('Tick', 1);
        nodeCircles.attr('cx', function (d) {
            return d.x;
        }).attr('cy', function (d) {
            return d.y;
        });
        linkLines.attr('x1', function (d) {
            return d.source.x;
        }).attr('y1', function (d) {
            return d.source.y;
        }).attr('x2', function (d) {
            return d.target.x;
        }).attr('y2', function (d) {
            return d.target.y;
        });
        that.optionDatumAlpha.value = parseFloat(that.simulation.alpha()).toFixed(8);
        optionsAlphaLabel.text(that.optionDatumAlpha.value);
        optionsAlphaSlider.property('value', that.optionDatumAlpha.value);
        // TestApp('Tick', -1);
    };

    TestApp('HybridMapClass', -1);
    return that;
}

function TestApp(source, position) {
    if (!logsTest || !performance || !performance.memory) {
        return;
    }
    if (position === 1) {
        stackLevel += 1;
        stackLevelTemp = stackLevel;
        stringSymbol = '> ';
        if (logsTest === 'out') {
            return;
        }
    } else if (position === -1) {
        stackLevelTemp = stackLevel;
        stackLevel -= 1;
        stringSymbol = '< ';
        if (logsTest === 'in') {
            return;
        }
    } else {
        stringSymbol = '• ';
    }
    stringSource = '%c' + (''.padStart(2 * stackLevelTemp) + stringSymbol + String(source)).padEnd(24);
    colorSource = 'color:black';
    sizeNodesOld = sizeNodesNew;
    sizeUsedOld = sizeUsedNew;
    sizeTotalOld = sizeTotalNew;
    sizeNodesNew = d3.selectAll('*').size();
    sizeUsedNew = performance.memory.usedJSHeapSize;
    sizeTotalNew = performance.memory.totalJSHeapSize;
    if (sizeNodesNew !== sizeNodesOld) {
        stringNodes = (sizeNodesNew + ' n').padStart(6);
        colorNodes = 'color:' + (sizeNodesNew < sizeNodesOld ? vs.test.colorGood : vs.test.colorBad);
    } else {
        stringNodes = '';
        colorNodes = 'color:' + vs.test.colorNeutral;
    }
    stringNodes = '%c' + stringNodes.padEnd(8);
    if (sizeUsedNew !== sizeUsedOld) {
        stringUsed = ((sizeUsedNew / (1024 * 1024)).toFixed(2) + ' Mb').padStart(8);
        colorUsed = 'color:' + (sizeUsedNew < sizeUsedOld ? vs.test.colorGood : vs.test.colorBad);
    } else {
        stringUsed = '';
        colorUsed = 'color:' + vs.test.colorNeutral;
    }
    stringUsed = '%c' + stringUsed.padEnd(12);
    if (sizeTotalNew !== sizeTotalOld) {
        stringTotal = ((sizeTotalNew / (1024 * 1024)).toFixed(2) + ' Mb').padStart(8);
        colorTotal = 'color:' + (sizeTotalNew < sizeTotalOld ? vs.test.colorGood : vs.test.colorBad);
    } else {
        stringTotal = '';
        colorTotal = 'color:' + vs.test.colorNeutral;
    }
    stringTotal = '%c' + stringTotal.padEnd(12);
    stringCombined = stringSource + stringNodes + stringUsed + stringTotal;
    console.log(stringCombined, colorSource, colorNodes, colorUsed, colorTotal);
}
