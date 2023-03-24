# Program Dataset Connector (PDAC)

The program dataset connector (or PDAC) app, automates the creation of metadata to allow for data transfer from the tracker to aggregate data models of DHIS2.

This can help with many different processes that you might want to do, however some common use cases are:

### Improved tracker analysis

Mapping tracker data to aggregate allows you to make full use of the powerful dimensional analysis of the aggregate data model for your tracker data. Disaggregate by any dimension you need and combine them to spot trends and patterns that would otherwise be invisible using just the tracker data alone.

### Speed up analytics

Sending the results of complex program indicator calculations to aggregate data elements allows you to pre-calculate the results, speeding up load times for complex analytics items significantly.

### Aggregate reporting

For tracker systems that need to report aggregate results, the PDAC app can be used to create all the necessary metadata to generate the output data files needed for reporting.

## Installation

The app can be most easily installed via the app hub, which can be accessed and installed from all DHIS2 instances via the App management app.

## How to setup a mapping?

Once the app is installed it can be accessed from the app menu like any native DHIS2 app.

When opened for the first time, you should see the following page with an empty table. This page will contain all the current mappings configured in the system:

![Empty home screen](./public/images/emptyHomeScreen.png 'Empty home screen')

To setup a new mapping, click the `add row` button and you should see the following:

![new mapping](./public/images/addNewRow1.png 'new mapping')

Every mapping requires three key things to setup:

### Data set:

This tells the app where to search for the data element that will store the data from the program indicator. If there are disaggregations on the dataset these will be made available in the mapping

### Aggregate data element

This tells the app specifically which data element with hold the data for the program indicator. If there are disaggregations on the data element, these will be made available in the mapping

### Program indicator

This tells the app where to get the data from and forms the basis of the program indicators the app will generate to setup the mapping.

### Category option filters

Once the data set, data element and program indicator are selected, the app will show a table of all the category options associated with the dissagregations on the data set and data element. For each disaggreation you want to map, you must fill out the filter field. This should contain a condition which can be added to the base program indicator to filter out the data to only this option from the category.

In the example below filters have been added to only return the inpatient cases where the age is less than 5 or greater than or equal to 5:

![Co filters example](./public/images/addCOFilters.png 'Co filter example')

You may recognise the syntax for these filters matches that from the program indicators interface in DHIS2. To configure these filters more easily you can use the native program indicators maintenance app in DHIS2, then copy the results over into the PDAC app.

Rows in the Category option filter table can be left blank. WHen this occurs the app will not generate any program indicators which include this disaggregation. To include the program indicators but not apply any filters, you can enter true into the filter field.

Once you have finished filling out the category option filters, click save to store the configuration for the mapping. You should now see the mapping on the home page, as shown below.

![Saved mapping](./public/images/savedMapping.png 'Saved mapping')

## Generating the mapping metadata

To the mapping has been configured the metaddata can be generated using the `generate mapping` button on the corresponding row of the mapping table.

Clicking this will show you how many program indicators will be generated as part of the mapping.

![Confirm generate mapping](./public/images/confirmGeneration.png 'Confirm generate mapping')

Clicking confirm will create the metadata for the mapping and then display a message showing the status of the generation; success or failure.

## The data transfer
The PDAC app is for setting up the metadata needed for the data transfer, but does not do the actual data transfer itself. The DHIS2 core team has developed a tool for performing the data transfer once the program indicators have been setup, you can see more details about how to setup and run this tool [here](https://developers.dhis2.org/blog/2022/05/speeding-up-your-program-indicators-with-tracker-to-aggregate/ 'T2A tool').

Alternatively as the data is now available via the progrma indicators, the api can be used to extract the data and trenasform it into aggregate data values in the correct format to be re-imported as aggregate data.

This required the app to generate indicators as well as program indicators, which is not done by default. To toggle this feature, open the `Datastore Management` app in DHIS2, then select `event-aggregate-mapper` > `metadata` you should then see a checkbox for `generateIndicators`, ticking this will cause the app to generate indicators as well as program indicators, as well as an indicator group which can be used to get all the data from the mapping in one go.

Once you have generated a mapping after ticking this checkbox, if you go to indicator groups in the maintenance app, you will see the generated group which looks something like this:

![Indicator group](./public/images/indicatorGroup.png 'Indicator group')

The name of this group can be used to extract the data from all the generated indicators in the mapping in one go using the data values API. For example if you were on https://play.dhis2.org/dev then you would start with the url something like:
https://play.dhis2.org/dev/api/analytics/dataValueSet.json?dimension=dx:IN_GROUP-w52Qv8Dn8IU&outputIdScheme=ATTRIBUTE:b8KbU93phhz

Where the rest of the url was copied from the indicator group name.

You will then see a message saying "At least one organisation unit must be specified". after adding an organisation unit and period parameters to the url you will get the aggregate data result. These parameters are used in the following format:

`&dimension=ou:ImspTQPwCqd&dimension=pe:2022`

So a full url example would be:
https://play.dhis2.org/dev/api/analytics/dataValueSet.json?dimension=dx:IN_GROUP-w52Qv8Dn8IU&outputIdScheme=ATTRIBUTE:b8KbU93phhz&dimension=ou:ImspTQPwCqd&dimension=pe:2022

This link will not work, because the indicator group `w52Qv8Dn8IU` does not exist on the specifies server, but it shows what the format should be.

To include many org units it is advised to use an organisation unit group for the `dimension=ou:ImspTQPwCqd` parameter, for example if you had a group with all you facilities in with UID `w52Qv8Dn8IU` then you would replace the UID `ImspTQPwCqd` with `OU_GROUP-w52Qv8Dn8IU`. Alternatively if you wanted to get all data at a certain level you would replace the UID with `LEVEL-2` where `2` could be replaced with the level you want to use.

Once you have the URL for the data, you just need to access this url and download the resulting file. This dile contains tracker data, but now mapped to the aggregate data element you selected. To import this simply upload the file using the import export app or send it via a request to the dataValues endpoint.

This project was bootstrapped with [DHIS2 Application Platform](https://github.com/dhis2/app-platform).
