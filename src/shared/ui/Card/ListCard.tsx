import React from 'react';
import {View} from 'react-native';
import {Card, CardHeader, CardBody, CardDivider} from './Card';
import type {ListCardProps} from './types';

export function ListCard<T>({
  title,
  icon,
  items,
  renderItem,
  maxItems = 20,
  variant = 'elevated',
  testID,
}: ListCardProps<T>) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card
      variant={variant === 'outline' ? 'outline' : 'elevated'}
      testID={testID}>
      <CardHeader icon={icon} title={title} />
      <CardBody>
        {displayItems.map((item, index) => (
          <View key={index}>
            {index > 0 && <CardDivider />}
            {renderItem(item, index)}
          </View>
        ))}
      </CardBody>
    </Card>
  );
}
