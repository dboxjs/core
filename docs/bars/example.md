# One Page Demo
``` html 

<html>
	<head>
      <title>Dbox Bars Demo</title>
      <link rel="stylesheet" href="css/dbox.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.7.0/d3-tip.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.js"></script>
      <script src="js/dbox.js"></script>
	</head>
	<body>
		<h1>Bars Chart</h1>
		<div id="chart"></div>
		<script>
			var data = [
				{
					"State": "CA",
					"Under 5 Years": 2704659,
					"5 to 13 Years": 4499890,
					"14 to 17 Years": 2159981,
					"18 to 24 Years": 3853788,
					"25 to 44 Years": 10604510,
					"45 to 64 Years": 8819342,
					"65 Years and Over": 4114496
				},
				{
					"State": "TX",
					"Under 5 Years": 2027307,
					"5 to 13 Years": 3277946,
					"14 to 17 Years": 1420518,
					"18 to 24 Years": 2454721,
					"25 to 44 Years": 7017731,
					"45 to 64 Years": 5656528,
					"65 Years and Over": 2472223
				},
				{
					"State": "NY",
					"Under 5 Years": 1208495,
					"5 to 13 Years": 2141490,
					"14 to 17 Years": 1058031,
					"18 to 24 Years": 1999120,
					"25 to 44 Years": 5355235,
					"45 to 64 Years": 5120254,
					"65 Years and Over": 2607672
				}
			]

			var config = {
				size: {
					width: 600,
					height: 400,
					margin: {top: 5, right: 5, bottom: 40, left: 100}
				},
				xAxis: {
					enabled: true,
					scale:  'band',
				},
				yAxis: {
					enabled: true,
					scale:  'linear',
					minZero:true,
				}
			};

		  var chart = dbox.chart(config)
				.bindTo('#chart')
				.data({
					raw: data, // Modified data by selectedChart (parse dates or fill NAs)
				});

			var bars = chart.layer(dbox.bars)
				.x('State')
				.y('Under 5 Years')
				.fill('State');

			chart.draw();

    </script>
	</body>
</html>

```
