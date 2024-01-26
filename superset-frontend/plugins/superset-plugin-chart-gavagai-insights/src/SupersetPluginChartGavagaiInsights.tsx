/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, useCallback, createRef, useState } from 'react';
import { styled } from '@superset-ui/core';
import Button from 'src/components/Button';
import Loading from 'src/components/Loading';
import ErrorAlert from 'src/components/ErrorMessage/ErrorAlert';
import {
  SupersetPluginChartGavagaiInsightsProps,
  SupersetPluginChartGavagaiInsightsStylesProps,
  FilterClause,
  ValidFilterColumns,
  InsightsPayload,
} from './types';
import { makeApi } from '@superset-ui/core';
import { addDangerToast } from 'src/components/MessageToasts/actions';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

// background-color: ${({ theme }) => theme.colors.secondary.light2};
const Styles = styled.div<SupersetPluginChartGavagaiInsightsStylesProps>`
  padding: ${({ theme }) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }) => theme.gridUnit * 2}px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;

  h3 {
    /* You can use your props to control CSS! */
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.gridUnit * 3}px;
    font-size: ${({ theme, headerFontSize }) =>
      theme.typography.sizes[headerFontSize]}px;
    font-weight: ${({ theme, boldText }) =>
      theme.typography.weights[boldText ? 'bold' : 'normal']};
  }

  pre {
    height: ${({ theme, headerFontSize, height }) =>
      height - theme.gridUnit * 12 - theme.typography.sizes[headerFontSize]}px;
  }
`;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

export default function SupersetPluginChartGavagaiInsights(
  props: SupersetPluginChartGavagaiInsightsProps,
) {
  // height and width are the height and width of the DOM element as it exists in the dashboard.
  // There is also a `data` prop, which is, of course, your DATA 🎉
  const { height, width, insightsPayload, filters } = props;
  const rootElem = createRef<HTMLDivElement>();
  const [isDisabled, setIsDisabled] = useState(true);
  const [isLoading, setIsloading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const infoAlertProps = {
    level: 'info',
    source: 'explore',
    title: 'Select a topic and a sentiment',
    description:
      'We can only generate insights for a topic and a sentiment at a time. To get insights, filter your data to show only one topic and one sentiment.',
  };
  const errorAlertProps = {
    level: 'error',
    source: 'explore',
    title: 'There has been an error',
  };

  // Often, you just want to access the DOM and do whatever you want.
  // Here, you can do that with createRef, and the useEffect hook.

  const findValidFilter = (
    filter: FilterClause,
    filterKey: ValidFilterColumns,
  ): boolean => filter.subject === filterKey && filter.comparator.length === 1;

  const disableButtonBasedOnFilters = useCallback(() => {
    if (!filters || (filters && filters.length === 0)) return true;

    const hasGroup: boolean = filters.some((filter: FilterClause) =>
      findValidFilter(filter, 'groups'),
    );
    const hasSentiment: boolean = filters.some((filter: FilterClause) =>
      findValidFilter(filter, 'topicSentiment'),
    );
    const hasValidData: boolean = hasGroup && hasSentiment;
    return !hasValidData;
  }, [filters]);

  useEffect(() => {
    const isButtonDisabled = disableButtonBasedOnFilters();
    setIsDisabled(isButtonDisabled);
    setData(null);
  }, [disableButtonBasedOnFilters]);

  const saveInsights = ({ key, data }: { key: string; data: any }) => {
    const result = { [key]: data };
    // TODO save in store
  };

  const getSavedInsights = ({ key }: { key: string }) => {
    const store = {
      state: {},
    };
    const hasKey = key in store.state;
    if (hasKey) {
      return store.state[key];
    }
    return null;
  };

  const getKey = () => {
    const { projectId, topic, sentiment } = insightsPayload;
    const key = btoa(`${projectId}:${topic}:${sentiment}`);
    return key;
  };

  const getInsights = async () => {
    setData(null);
    setIsloading(true);
    const key = getKey();
    const savedInsights = getSavedInsights({ key });

    if (savedInsights) {
      setData(savedInsights);
      return;
    }

    try {
      const api = makeApi<InsightsPayload, any>({
        method: 'POST',
        endpoint: `/api/v1/gavagai/insights`,
      });
      const response = await api(insightsPayload);
      const data = response.result;
      setData(data);
      saveInsights({ key, data });
      setIsloading(false);
    } catch (err) {
      setIsloading(false);
      getClientErrorObject(err).then(
        ({ error, message }: { error: any; message: string }) => {
          console.log(error, message);
          const errorMessage = error
            ? error.error || error.statusText || error
            : message;
          addDangerToast(errorMessage);
        },
      );
      // const { message }: { message: string } = error;
      // setError(message);
    }
  };

  return (
    <Styles
      ref={rootElem}
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      height={height}
      width={width}
    >
      <h3>{props.headerText}</h3>
      <p>{props.descriptionText}</p>
      {isDisabled && <ErrorAlert {...infoAlertProps} />}
      {isLoading && <Loading />}
      {data && !isLoading && (
        <>
          <div>{JSON.stringify(data)}</div>
          <br />
        </>
      )}
      {error && (
        <>
          <ErrorAlert {...errorAlertProps} description={error} />
          <br />
        </>
      )}
      {!isDisabled && !isLoading && (
        <Button onClick={getInsights} buttonStyle="tertiary">
          {props.buttonText}
        </Button>
      )}
    </Styles>
  );
}
