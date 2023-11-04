import React, { Fragment, useState } from 'react'
import { GroupByRes, useGroupBy } from 'src/api/groupByService'
import { PageContainer } from '../components/PageContainer'
import OperatorHbarChart from './OperatorHbarChart/OperatorHbarChart'
import './DashboardPage.scss'
import { TEXTS } from 'src/resources/texts'
import ArrivalByTimeChart from './ArrivalByTimeChart/ArrivalByTimeChart'
import moment from 'moment'
import LinesHbarChart from './LineHbarChart/LinesHbarChart'
import { Tooltip } from '@mui/material'
import OperatorSelector from 'src/pages/components/OperatorSelector'
import { useDate } from '../components/DateTimePicker'
import { Button, Skeleton } from 'antd'
import Grid from '@mui/material/Unstable_Grid2' // Grid version 2
import { Label } from '../components/Label'
import { DateSelector } from '../components/DateSelector'

const now = moment()

const convertToChartCompatibleStruct = (arr: GroupByRes[]) => {
  return arr.map((item: GroupByRes) => ({
    id: item.operator_ref?.agency_id || 'Unknown',
    name: item.operator_ref?.agency_name || 'Unknown',
    total: item.total_planned_rides,
    actual: item.total_actual_rides,
  }))
}
const convertToWorstLineChartCompatibleStruct = (arr: GroupByRes[], operatorId: string) => {
  if (!arr || !arr.length) return []
  return arr
    .filter((row: GroupByRes) => row.operator_ref?.agency_id === operatorId || !Number(operatorId))
    .map((item: GroupByRes) => ({
      id: `${item.line_ref}|${item.operator_ref?.agency_id}` || 'Unknown',
      operator_name: item.operator_ref?.agency_name || 'Unknown',
      short_name: JSON.parse(item.route_short_name)[0],
      long_name: item.route_long_name,
      total: item.total_planned_rides,
      actual: item.total_actual_rides,
    }))
}
const convertToGraphCompatibleStruct = (arr: GroupByRes[]) => {
  return arr.map((item: GroupByRes) => ({
    id: item.operator_ref?.agency_id || 'Unknown',
    name: item.operator_ref?.agency_name || 'Unknown',
    current: item.total_actual_rides,
    max: item.total_planned_rides,
    percent: (item.total_actual_rides / item.total_planned_rides) * 100,
    gtfs_route_date: item.gtfs_route_date,
    gtfs_route_hour: item.gtfs_route_hour,
  }))
}

const DashboardPage = () => {
  const [startDate, setStartDate] = useDate(now.clone().subtract(7, 'days'))
  const [endDate, setEndDate] = useDate(now.clone().subtract(1, 'day'))
  const [groupByHour, setGroupByHour] = React.useState<boolean>(false)

  const [operatorId, setOperatorId] = useState('')
  const [groupByOperatorData, groupByOperatorLoading] = useGroupBy({
    dateTo: endDate,
    dateFrom: startDate,
    groupBy: 'operator_ref',
  })

  const [groupByLineData, lineDataLoading] = useGroupBy({
    dateTo: endDate,
    dateFrom: startDate,
    groupBy: 'operator_ref,line_ref',
  })

  const [graphData, loadingGrap] = useGroupBy({
    dateTo: endDate,
    dateFrom: startDate,
    groupBy: groupByHour ? 'operator_ref,gtfs_route_hour' : 'operator_ref,gtfs_route_date',
  })

  return (
    <PageContainer>
      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{ marginTop: '20px' }}
        justifyContent="space-between">
        <Grid lg={6} xs={12} container spacing={2} alignItems="center">
          <Grid xs={4}>
            <DateSelector
              time={startDate}
              onChange={(data) => setStartDate(data)}
              customLabel={TEXTS.start}
            />
          </Grid>
          {/* <Grid xs={1}>-</Grid> */}
          <Grid xs={4}>
            <DateSelector
              time={endDate}
              onChange={(data) => setEndDate(data)}
              customLabel={TEXTS.end}
            />
          </Grid>
          {/* <Grid xs={3}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.7rem', textAlign: 'center' }}>
                {TEXTS.group_by_hour_tooltip_content}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Switch checked={groupByHour} onChange={(e) => setGroupByHour(e.target.checked)} />
              </div>
            </div>
          </Grid> */}
        </Grid>
        <Grid lg={1} display={{ xs: 'none', lg: 'block' }}>
          <Label text={TEXTS.choose_operator} />
        </Grid>
        <Grid lg={5} display={{ xs: 'none', lg: 'block' }}>
          <OperatorSelector
            operatorId={operatorId}
            setOperatorId={setOperatorId}
            onlyMajorOperators
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid xs={12} lg={6}>
          <div className="widget">
            <h2 className="title">
              {TEXTS.dashboard_page_title}
              <Tooltip
                title={convertLineFeedToHtmlTags(TEXTS.dashboard_tooltip_content)}
                placement="left"
                arrow>
                <span className="tooltip-icon">i</span>
              </Tooltip>
            </h2>
            {groupByOperatorLoading ? (
              <Skeleton active />
            ) : (
              <OperatorHbarChart operators={convertToChartCompatibleStruct(groupByOperatorData)} />
            )}
          </div>
        </Grid>
        <Grid xs={6} display={{ xs: 'block', lg: 'none' }}>
          <OperatorSelector
            operatorId={operatorId}
            setOperatorId={setOperatorId}
            onlyMajorOperators
          />
        </Grid>
        <Grid xs={12} lg={6}>
          <div className="widget">
            <h2 className="title">{TEXTS.worst_lines_page_title}</h2>
            {lineDataLoading ? (
              <Skeleton active />
            ) : (
              <LinesHbarChart
                lines={convertToWorstLineChartCompatibleStruct(groupByLineData, operatorId)}
                operators_whitelist={['אלקטרה אפיקים', 'דן', 'מטרופולין', 'קווים', 'אגד']}
              />
            )}
          </div>
        </Grid>
        <Grid xs={12}>
          <div className="widget">
            <h2 className="title">
              {groupByHour
                ? TEXTS.dashboard_page_graph_title_hour
                : TEXTS.dashboard_page_graph_title_time}
            </h2>
            <Button style={{ marginBottom: '10px' }} onClick={() => setGroupByHour(!groupByHour)}>
              {groupByHour
                ? TEXTS.group_by_default_tooltip_content
                : TEXTS.group_by_hour_tooltip_content}
            </Button>
            {loadingGrap ? (
              <Skeleton active />
            ) : (
              <ArrivalByTimeChart data={convertToGraphCompatibleStruct(graphData)} />
            )}
          </div>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

function convertLineFeedToHtmlTags(srt: string): React.ReactNode {
  return srt.split('\n').map((row, i) => (
    <Fragment key={i}>
      {row}
      <br />
    </Fragment>
  ))
}

export default DashboardPage
